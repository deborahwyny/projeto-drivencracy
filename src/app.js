import { MongoClient,ObjectId } from "mongodb"
import express from 'express'
import cors from 'cors'
import dotenv from "dotenv"
import joi from "joi"
import dayjs from 'dayjs'




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

})


/// endpoints
app.post("/poll", async (req, res)=>{

    const {title, expireAt} = req.body
    // const validacao =  validadorPoll.validate({title})
    // if (validacao.error) {
    //     return res.status(422).send(validacao.error.details.map(detail => detail.message))
    // }


    const data = Date.now()
    const horario = dayjs(data).format('YYYY-MM-DD HH:mm')
    const expiracaoPadrao = new Date();
    expiracaoPadrao.setDate(expiracaoPadrao.getDate() + 30);
    const dataAutomatica = dayjs(expiracaoPadrao).format('YYYY-MM-DD HH:mm');
    const pollCriada = {
        title: title, 
        expireAt: expireAt? horario: dataAutomatica
    }



    try{

        const verificadorTitle = await db.collection("/poll").find({ title }).toArray();
        if (verificadorTitle.length > 0) return res.sendStatus(422);


        await db.collection("/poll").insertOne(pollCriada)
        return res.sendStatus(201)

    } catch(err){
        res.status(500).send(err.message);
    }

})

app.get("/poll", async (req, res)=>{


    try {

        const listaPoll = await db.collection("/poll").find().toArray()
        res.send(listaPoll)

    } catch(err){
        res.status(500).send(err.message)

    }

})

app.post("/choice", async (req, res)=>{

    const {title, pollId} = req.body
    const validacao =  validadorPoll.validate({title})
    if (validacao.error) {
        return res.status(422).send(validacao.error.details.map(detail => detail.message))
    }
    const choicePoll = {
        title:title,
        pollId: new ObjectId(pollId),
    }


    try {


        const repetido = await db.collection("/poll").findOne({title})
        if(repetido) return res.sendStatus(409)

        const pollExistente = await db.collection("/poll").find({_id: new ObjectId(pollId) })
        if(!pollExistente) return res.sendStatus(404)
    
        await db.collection("/choice").insertOne(choicePoll)
        return res.sendStatus(201)

    } catch(err){
        res.status(500).send(err.message)
    }
})

app.get("/poll/:id/choice", async(req, res)=>{

    const { id } = req.params

    try{

        const enqueteDisponivel = await db.collection("/poll").findOne({_id: new ObjectId(id)})
        if(!enqueteDisponivel) return res.sendStatus(404)

        const listaChoice = await db.collection("/choice").find().toArray()
        res.send(listaChoice)



    } catch(err){
        res.status(500).send(err.message)
    }
})

app.post("/choice/:id/vote", async (req, res)=>{


    try {

        return res.sendStatus(201)

    } catch(err){
        res.status(500).send(err.message)
    }
})



////
/// porta sendo utilizada
const PORT = 4000
app.listen(PORT, () =>console.log(`servidor está rodando na porta ${PORT}`))