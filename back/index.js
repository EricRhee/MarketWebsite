const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const cors = require('cors')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const flash = require('connect-flash')
const UserModel = require('./models/Users')
const ProductModel = require('./models/Product')

const app = express()

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.use(express.static(path.join(__dirname, '../public')));

app.use(express.urlencoded({extended:true}))
app.use(cors())
app.use(express.json());

app.use(cookieParser('SecretStringForCookies'));
app.use(session({
    secret: 'SecretStringForSession',
    cookie: {maxAge: 60000},
    resave: true,
    saveUninitialized: true
}));
app.use(flash());

mongoose.connect("mongodb+srv://ericrhee83224:Thorkell83224@market.m7cof.mongodb.net/mern?retryWrites=true&w=majority&appName=Market")
const db = mongoose.connection

db.once('open', ()=> {
    console.log("Mongodb connection successful")
})

app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

app.get("/", async function(req, res) {
    try {
        // Fetch all products from the database
        const allProducts = await ProductModel.find();

        // Split products into different categories
        const trendingProducts = allProducts.filter(product => product.trending);
        const discountProducts = allProducts.filter(product => product.discounted);
        const seasonalProducts = allProducts.filter(product => product.seasonal);
        const generalProducts = allProducts.filter(product => product.general);

        const successMessage = req.flash('success');
        const errorMessage = req.flash('error');
        const user = req.session.user;

        // Render the index page and pass the data
        res.render('index', { 
            successMessage, 
            errorMessage, 
            user, 
            trendingProducts, 
            discountProducts, 
            seasonalProducts, 
            generalProducts 
        });
    } catch (error) {
        res.status(500).json({ error: "Error fetching products" });
    }
});

app.get("/user-settings", function(req, res) {
    res.render('account-settings')
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
    res.redirect("/")
    //res.status(204).send();
    //res.send("hello");
})

app.post("/login", async function(req, res) {
    try {
        const user = await UserModel.findOne({ email: req.body.email });
        if (user) {
            const result = req.body.password == user.password;
            if (result) {
                req.session.user = user;
                req.flash('success', 'Login Successful')
                res.redirect("/")
                
            } else  {
                req.flash('error', 'email or password does not match')
                res.redirect("/")
            }
        } else {
            req.flash('error', 'email or password does not match')
            res.redirect("/")
        }
    } catch(error) {
        res.status(400).json({ error });
    }
})

app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send("Error logging out");
        }
        res.redirect('/');
    });
})




app.post('/addProduct', async (req, res) => {
    const { name, description, price, imageUrl, trending, discounted, seasonal, general, discount} = req.body;

    const newProduct = new ProductModel({
        name,
        description,
        price,
        imageUrl,
        trending,
        discounted,
        seasonal,
        general,
        discount
    });

    await newProduct.save();
    res.send('Product added successfully');
})

app.listen(3004, () => {
    console.log("Server is Running")
})