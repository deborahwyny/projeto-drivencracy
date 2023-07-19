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
    const validacao =  validadorPoll.validate({title})
    if (validacao.error) {
        return res.status(422).send(validacao.error.details.map(detail => detail.message))
    }


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


        const repetido = await db.collection("/choice").findOne({title})
        if(repetido) return res.sendStatus(409)

        const pollExistente = await db.collection("/poll").find({_id: new ObjectId(pollId) })
        if(!pollExistente) return res.sendStatus(404)
        if (pollExistente.expireAt && dayjs(pollExistente.expireAt).isBefore(dayjs())) {
            return res.sendStatus(403)
          }        
    
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

        
        const listaChoice = await db.collection("/choice").find({pollId: new ObjectId(id)}).toArray()
        console.log("oi", listaChoice)
        const objChoices = listaChoice.map(choice => ({
            _id: choice._id.toString(),
            title: choice.title,
            pollId: choice.pollId.toString()
          }))

        res.send(objChoices)



    } catch(err){
        res.status(500).send(err.message)
    }
})

app.post("/choice/:id/vote", async (req, res)=>{
    const { id } = req.params
    console.log("Received choice ID:", id)


    try {

        const choice = await db.collection("/choice").findOne({ _id: new ObjectId(id) });
        if (!choice) return res.sendStatus(404)
        console.log("oi:", choice)


        const poll = await db.collection("/poll").findOne({ _id: choice.pollId });
        if (!poll) return res.sendStatus(404)
        console.log("oi2:", poll)


        if (poll.expireAt && dayjs(poll.expireAt).isBefore(dayjs())) return res.sendStatus(403)
        console.log("oi3:")



        const resultado = {
            title: choice.title,
            pollId: choice.pollId,
            choiceId: choice._id,
            createdAt: dayjs().format("YYYY-MM-DD HH:mm"),
        };
        console.log("teste", resultado)



        await db.collection("/voto").insertOne(resultado)

         res.sendStatus(201)

    } catch(err){
        res.status(500).send(err.message)
    }
})

app.get("/poll/:id/result", async(req, res)=>{
    const {id} = req.params

    try{

        const resultadoVoto = await db. collection("/voto").findOne({_id: new ObjectId(id)})
        if(!resultadoVoto) return res.sendStatus(404)

        const choice = await db.collection("/choice").findOne({_id: new ObjectId(id)})
        if(!choice) return res.sendStatus(404)

        const voto = {
            title: resultadoVoto.title,
            createdAt: resultadoVoto.createdAt,
        }


    }catch(err){
        res.status(500).send(err.message)

    }
})





////
/// porta sendo utilizada
const PORT = 5000
app.listen(PORT, () =>console.log(`servidor está rodando na porta ${PORT}`))