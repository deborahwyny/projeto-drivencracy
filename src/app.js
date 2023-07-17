import { MongoClient } from "mongodb"
import express from 'express'
import cors from 'cors'
import dotenv from "dotenv"
import joi from "joi"



//// configurações

const app = express();
app.use(cors());
app.use(express.json())
dotenv.config()

//// conexão com o banco
const mongoClient = new MongoClient(process.env.DATABASE_URL)
let db

mongoClient.connect()
    .then(()=> db = mongoClient.db())
    .catch((err)=> console.log(err.message))


//// variaveis globais 

const validadorPoll = joi.object({
    title: joi.string().required(),
    expireAt: joi.string()

})

/// endpoints
app.post("/poll", async (res,req)=>{

    const {title, expireAt} = req.body

    const data = Date.now()


    try{

        const {erro} = validadorPoll.validate({title})
        if(erro) return res.status(422).send("Title não pode ser uma string vazia")


        await db.collection("/poll").insertOne({title:title , expireAt:expireAt})


        return res.sendStatus(201)

    } catch(err){
        res.status(500).send(err.message);
    }

})




////
/// porta sendo utilizada
const PORT = 4000
app.listen(PORT, () =>console.log(`servidor está rodando na porta ${PORT}`))