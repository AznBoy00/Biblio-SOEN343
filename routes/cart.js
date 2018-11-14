// Config Variables
var session = require('express-session');
var express = require('express');
var router = express.Router();
router.use(session({
    secret : '2C44-4D44-WppQ38S',
    resave : true,
    saveUninitialized : true
}));
var expressValidator = require('express-validator');
router.use(expressValidator());
var cart = require('../models/cart');
var user = require('../models/users');
var catalog = require('../models/catalog');

// ====================================== //
// == Get shopping cart page === //
// ====================================== //
router.get('/', async (req, res) => {
    try {
      let list = await catalog.getCartCatalog(req);
      res.render('cart', { title: 'Cart', is_logged: req.session.logged, list: await list, filter: false});
    } catch (err) {
      console.error(err);
      res.render('error', { error: err });
    }
});

// ====================================== //
// == Add item to shopping cart === //
// ====================================== //
router.get('/add/:item_id', async (req, res) => {
    try {
      // Add Item to cart
      cart.addItemToCart(req);
      // console.log("ITEM_ID: " + req.params.item_id);
      res.redirect('/cart');
    } catch (err) {
      console.error(err);
      res.render('error', { error: err });
    }
});
  
// ====================================== //
// ==  Delete item from shopping cart === //
// ====================================== //
router.get('/remove/:i', async (req, res) => {
    try {

      cart.deleteItemFromCart(req);
      // Remove Item from cart
      res.redirect('/cart');
    } catch (err) {
      console.error(err);
      res.render('error', { error: err });
    }
});

// ====================================== //
// == Checkout entire shopping cart === //
// ====================================== //
router.get('/checkout', async (req, res) => {
  try {
    
    res.redirect('/cart');
  } catch (err) {
    console.error(err);
    res.render('error', { error: err });
  }
});

// ====================================== //
// == Clear entire shopping cart === //
// ====================================== //
router.get('/clear', async (req, res) => {
  try {
    cart.deleteAllItemsFromCart(req);
    res.redirect('/cart');
  } catch (err) {
    console.error(err);
    res.render('error', { error: err });
  }
});

//keep the next line at the end of this script
module.exports = router;