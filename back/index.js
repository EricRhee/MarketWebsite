const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const cors = require('cors')
const UserModel = require('./models/Users')

const app = express()
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.urlencoded({extended:true}))
app.use(cors())
app.use(express.json());

mongoose.connect("mongodb+srv://ericrhee83224:Thorkell83224@market.m7cof.mongodb.net/mern?retryWrites=true&w=majority&appName=Market")
const db = mongoose.connection

db.once('open', ()=> {
    console.log("Mongodb connection successful")
})


app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get("/getUsers", (req, res) => {
    UserModel.find({}).then(function(users){
        res.json("users")
    }).catch(function (err) {
        res.json(err)
    })
})

app.post("/createUser", async (req, res) => {
    const user = req.body;
    const newUser = new UserModel(user);
    await newUser.save();
    //res.status(204).send();
    //res.send("hello");
})

app.post("/login", async function(req, res) {
    try {
        const user = await UserModel.findOne({ email: req.body.email });
        if (user) {
            const result = req.body.password == user.password;
            if (result) {

                res.send('successful');
                
            } else  {
                res.status(400).json({ error: "password doesn't match" });
            }
        } else {
            res.status(400).json({ error: "email doesn't match" });
        }
    } catch(error) {
        res.status(400).json({ error });
    }
})

app.listen(3004, () => {
    console.log("Server is Running")
})