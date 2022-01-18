//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

mongoose.connect('mongodb+srv://crowBottom:Tottenham7@cluster0.y6mwl.mongodb.net/todoDB', { useNewUrlParser: true });

const app = express();
app.set('view engine', "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));


const itemSchema = new mongoose.Schema({
  todo: String,
})
const Item = mongoose.model("Item", itemSchema)


// DEFAULT ITEMS ADDED TO DATBASE ######################################################################
const item1 = new Item({
  todo: "Welcome to your todolist!"
});
const item2 = new Item({
  todo: "Hit the + button to add a new item"
})
const item3 = new Item({
  todo: "<-- Hit this to delete an item."
})
const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
})
const List = mongoose.model("List", listSchema)
/*
Item.deleteMany({}, (err) => {
  if(err){
    console.log(err);
  }
  else{
    log("deleted.")
  }
})
*/


// ROUTES ######################################################################

// GET ROUTE ROOT -- load our list.html
app.get("/", (req, res) => {

  // get all items from our database and render them in our list view
  Item.find({}, (err, items) => {

      if (items.length === 0) {
        Item.insertMany(defaultItems, (err) => {
          if (err) {
            console.log(err);
          } else {
            console.log("Items saved.");
          }
        })
        res.redirect("/")
      }
      else {
        res.render("list", {listTitle: "Today", todoList: items})
      }
  })

});

// DYNAMIC ROUTE for list
app.get("/:customListName", (req, res) => {

  const customListName = _.capitalize(req.params.customListName);
  console.log(customListName)

  List.findOne({name: customListName}, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        // create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect(`/${customListName}`)
      } else {
        // show an existing list
        res.render("list", {listTitle: customListName, todoList: foundList.items})
      }
    }
  })

});


// POST ROUTE ROOT -- post a new todo from the form in list.html to the array 'todos' in our global variables
app.post("/", (req, res) => {

  const newItem = req.body.todo;
  const listName = req.body.list
  const newTodo = new Item({
    todo: newItem
  })

  if (listName === "Today"){
    newTodo.save();
    res.redirect("/")
  } else {
    List.findOne({name: listName}, (err, foundList) => {
      foundList.items.push(newTodo)
      foundList.save();
      res.redirect(`/${listName}`)
    })
  }
})

// DELETE a todo
app.post("/delete", (req, res) => {

  //grab the item's id
  const itemToDelete = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today"){
    // delete it from the database
    Item.deleteOne({_id: itemToDelete}, (err) => {
      if(err){
        console.log(err);
      } else {
        console.log("Item deleted.");
      }
    })
    // redirect back to the root route
    res.redirect("/");
  } else {

    List.findOneAndUpdate({name: listName},{$pull: {items: {_id: itemToDelete}} }, (err, foundList) => {
      if(!err){
        res.redirect(`/${listName}`)
      }else {

      }
    })

  }
})


//About
app.get('/about', (req, res) => {
  res.render('about')
})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

// server listening
app.listen(port, () => {
  console.log("Server up and running successfully");
});
