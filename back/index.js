const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const cors = require('cors')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const flash = require('connect-flash')
const UserModel = require('./models/Users')

const app = express()

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())



app.use(express.static(path.join(__dirname, '../public')));

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));
app.use(flash());

app.use(express.urlencoded({extended:true}))
app.use(cors())
app.use(express.json());

mongoose.connect("mongodb+srv://ericrhee83224:Thorkell83224@market.m7cof.mongodb.net/mern?retryWrites=true&w=majority&appName=Market")
const db = mongoose.connection

db.once('open', ()=> {
    console.log("Mongodb connection successful")
})

app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    console.log("got throught")
    next();
});

app.get("/", function(req, res) {
    //res.sendFile(path.join(__dirname, '../public/index.html'));
    res.render('index', { message : req.flash('message')})
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
                req.flash('message', 'Login Successful')
                console.log('Flash message set: Login Successful');
                res.redirect("/")
                
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