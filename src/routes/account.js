const express = require("express")
const mongoose = require("mongoose")
const { authMiddleware } = require("../middleware")
const { Account } = require("../db")
const accountRouter = express.Router()
const zod = require("zod")


const transferBody = zod.object({
    to: zod.string(),
    amount: zod.number()
})
accountRouter.get('/balance', authMiddleware, async (req, res) => {
    const userId = req.userId

    try {
        const account = await Account.findOne({
            userId: userId
        })
        
        if(account === null) {
            return res.status(404).json({
                message:"Account not found"
            })
        }

        res.json({
            balance:account.balance
        })

    }
    catch(err) {
        console.error(err)
        return res.status(500).json({
            message:"Something went wrong"
        })
    }
})

accountRouter.post('/transfer', authMiddleware, async (req, res) => {
    const session = await mongoose.startSession();
    const userId = req.userId
    const body = req.body

    const result = transferBody.safeParse(body)
    if(!result.success) {
        return res.status(411).json({
            message:"Invalid Inputs."
        })
    }

    session.startTransaction()
    try {
        const toAccount = await Account.findOne({
            userId: result.data.to
        }).session(session)

        const fromAccount = await Account.findOne({
            userId: userId
        }).session(session)

        if(fromAccount.balance < result.data.amount) {
            await session.abortTransaction()
            session.endSession()
            return res.json({
                message: "Insufficient Balance"
            })
        }

        if(toAccount === null) {
            await session.abortTransaction()
            session.endSession()
            return res.status(404).json({
                message: "Account not found"
            })
        }

        await Account.updateOne({
            userId: userId
        }, {
            $inc: {
                balance: -result.data.amount
            }
        },
        {session}
    )

        await Account.updateOne({
            userId: result.data.to
        }, {
            $inc: {
                balance: +result.data.amount
            }
        },
        {session}
    )

        await session.commitTransaction()
        session.endSession()
        
        res.json({
            message: "Transfer Successful"
        })

    }
    catch(err) {
        await session.abortTransaction()
        session.endSession()
        console.error(err)
        return res.status(500).json({
            message:"Something went wrong"
        })
    }
})
module.exports = {accountRouter}