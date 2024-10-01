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
    req.session.returnTo = req.originalUrl;
    next();
});

app.get("/", async function(req, res) {
    try {
        
        const allProducts = await ProductModel.find();

        
        const trendingProducts = allProducts.filter(product => product.trending);
        const discountProducts = allProducts.filter(product => product.discounted);
        const seasonalProducts = allProducts.filter(product => product.seasonal);
        const generalProducts = allProducts.filter(product => product.general);

        const successMessage = req.flash('success');
        const errorMessage = req.flash('error');
        const user = req.session.user;

        const rowsToShow = parseInt(req.query.rowsToShow) || 4;
        const productsPerRow = 7;

        
        res.render('index', { 
            successMessage, 
            errorMessage, 
            user, 
            trendingProducts, 
            discountProducts, 
            seasonalProducts, 
            generalProducts,
            rowsToShow, 
            productsPerRow 
        });
    } catch (error) {
        res.status(500).json({ error: "Error fetching products" });
    }
});

app.get("/product", function(req, res) {
    try {
        const successMessage = req.flash('success');
        const errorMessage = req.flash('error');
        const user = req.session.user;

        res.render('product', {
            successMessage, 
            errorMessage, 
            user
        })
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
    const redirectUrl = req.body.redirectUrl || "/";
    res.redirect(redirectUrl)
    //res.status(204).send();
    //res.send("hello");
})

app.post("/login", async function(req, res) {
    try {
        const user = await UserModel.findOne({ email: req.body.email });
        if (user) {
            const result = req.body.password == user.password;
            delete req.session.returnTo;
            if (result) {
                req.session.user = user;
                req.flash('success', 'Login Successful')
                const redirectUrl = req.body.redirectUrl || "/";
                res.redirect(redirectUrl)
                
            } else  {
                req.flash('error', 'email or password does not match')
                res.redirect(req.body.redirectUrl || "/")
            }
        } else {
            req.flash('error', 'email or password does not match')
            res.redirect(req.body.redirectUrl || "/")
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

app.get("/product/:id", async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await ProductModel.findById(productId);

        const successMessage = req.flash('success');
        const errorMessage = req.flash('error');
        const user = req.session.user;

        if (!product) {
            return res.status(404).send("Product not found");
        }

        res.render("product", { product, successMessage, errorMessage, user });
    } catch (error) {
        res.status(500).send("Error retrieving product");
    }
});

app.get('/saves', async (req, res) => {
    try {
        if (!req.session.user) {
            req.flash('error', 'You need to log in to view your saved items');
            const redirectUrl = req.query.redirectUrl || "/";
            return res.redirect(redirectUrl);
        }

        const user = await UserModel.findById(req.session.user._id).populate('savedItems');
        res.render('saves', { savedItems: user.savedItems });
    } catch (error) {
        req.flash('error', 'Error fetching saved items.');
        res.redirect('/');
    }
});

app.post('/save-product', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ success: false, message: 'You need to log in to save items.' });
        }

        const userId = req.session.user._id;
        const productId = req.body.productId;

        
        const user = await UserModel.findById(userId);

        if (!user.savedItems.includes(productId)) {
            user.savedItems.push(productId);  
            await user.save();  
        }

        res.json({ success: true, message: 'Product saved successfully!' });
    } catch (error) {
        console.error('Error saving product:', error);
        res.status(500).json({ success: false, message: 'Error saving product.' });
    }
});

app.post('/removeSaved/:productId', async (req, res) => {
    try {
        const productId = req.params.productId;
        const userId = req.session.user._id;

        await UserModel.findByIdAndUpdate(userId, {
            $pull: { savedItems: productId }
        });

        req.flash('success', 'Item removed from saved items.');
        res.redirect('/saves'); 
    } catch (error) {
        req.flash('error', 'Error removing item.');
        res.redirect('/saves'); 
    }
});

app.listen(3004, () => {
    console.log("Server is Running")
})