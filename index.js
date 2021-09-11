const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const fileUpload = require('express-fileupload')

const fs = require('fs-extra')
require('dotenv').config();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('news-pic'))
app.use(fileUpload());



const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.s17y2.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const newsCollection = client.db("news-daily").collection("news");
  const adminCollection = client.db("news-daily").collection("admin");
  // perform actions on the collection object


  app.get('/news', (req, res) => {
    newsCollection.find({})
    .toArray((err, documents) =>{
        res.send(documents)
    })
  })

  app.get('/fullNews/:id',(req, res) =>{
    const id = req.params.id;
    
    newsCollection.find({_id: ObjectId(id)})
    .toArray((err, document)=>{
        res.send(document)
    })
})

app.get('/international',(req, res) =>{

  newsCollection.find({catagory: "international"})
  .toArray((err, document)=>{
      res.send(document)
      console.log(document)
  })
})

app.post("/addAdmin" , (req, res)=>{
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  adminCollection.insertOne({name, email , password})
  .then(result=>{
    console.log("inserted count" , result.insertedCount)
    res.send(result.insertedCount>0)
  })
})

app.post('/isAdmin', (req, res) => {
  const email = req.body.email;
  adminCollection.find({ email: email })
    .toArray((err, admin) => {
      res.send(admin.length > 0)
    })
})

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  adminCollection.find({email: email , password: password})
      .toArray((err, documents) => {
          res.send(documents[0]);
      });
});


  app.post('/addNews' , (req, res) =>{
    const file = req.files.file;
    const title = req.body.title;
    const description = req.body.description;
    const author = req.body.author;
    const catagory = req.body.catagory;

    const filePath = `${__dirname}/news-pic/${file.name}`;

    console.log(title , file , description , author , catagory);
    file.mv(filePath , err =>{
      console.log(err)
      const newsImg = fs.readFileSync(filePath);
      const encImg = newsImg.toString('base64');

      var image = {
        contentType: req.files.file.mimetype,
        size: req.files.file.size,
        img: Buffer(encImg , 'base64')
      }
     // return res.send({name: file.name , path: `/${file.name}`})
     newsCollection.insertOne({title , description , image , author , catagory})
     .then(result => {
       fs.remove(filePath, error =>{
         if(error){console.log(error)}
       })
       res.send(result.insertedCount > 0);
     })
    })
  })
  
});



const port = 5000;
app.listen(process.env.PORT || port)