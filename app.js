//jshint esversion:6

const express = require("express");//The Express.js framework for handling HTTP requests and routes.
const bodyParser = require("body-parser");//Middleware to parse the incoming request bodies.
const mongoose = require('mongoose');//A MongoDB object modeling tool to work with MongoDB.


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://0.0.0.0:27017/todolistDB", { useNewUrlParser: true }, { useUnifiedTopology: true } );

const itemsSchema = mongoose.Schema({  //Schema for individual to-do items with a single field "name.
  name: String
});

const Item = mongoose.model("Item", itemsSchema);// Mongoose model for individual to-do items based on the "itemsSchema."

const item1 = new Item({
  name: "Welcome to your todolist"
});

const item2 = new Item({
  name: "Hit the + button to add a new item"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item>"
});

const defaultItems = [item1, item2, item3];

const listSchema = { // Schema for a to-do list containing a "name" field (the list title) and an array of "items."
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);// Mongoose model for to-do lists based on the "listSchema."



app.get("/", function (req, res) {


  Item.find(function (err, foundItems) {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("inserted default items in DB successfully..")
        }
      });
      res.redirect("/")
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }




  });

}); 
//When a user accesses the home page, the server queries the database for all the items in the "Item" collection using Item.find(...).

//If no items are found, it inserts the defaultItems into the database and redirects the user back to the home page.

//If items are found, it renders the "list.ejs" template with the data obtained from the database, passing the list title as "Today" and the found items as "newListItems.

app.get("/:customListName", function (req, res) {
  const customListName = (req.params.customListName);

  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        //create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        // show an existing list
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    }
  })
});
//When a user accesses a custom list (e.g., "/work" or "/school"), the server queries the database to find the list with the specified name.

//If the list is not found, it creates a new list with the provided name and redirects the user to the newly created list.

//If the list exists, it renders the "list.ejs" template with the data obtained from the database, passing the list title and the list items.


app.post("/", function (req, res) {

  const itemName = req.body.newItem;

  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });


  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }
});
//When a user submits a new item using a form, this route is triggered.

//It creates a new "Item" object with the provided item name and saves it to the database.

//If the item is added to the "Today" list, it redirects the user back to the home page.

//If the item is added to a custom list, it finds the list in the database, pushes the new item into its "items" array, and saves the list. Then, it redirects the user to the custom list page.

app.post("/delete", function (req, res) {
  const checkedItemId = (req.body.checkbox);

  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (!err) {
        console.log("successfully deleted checked item..");
        res.redirect("/")
      }
    });

  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, function (err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }

    });
  }
});
//When a user checks an item to delete using a checkbox, this route is triggered.

//If the item is in the "Today" list, it is directly removed from the database using Item.findByIdAndRemove(...).

//If the item is in a custom list, it finds the list, removes the item from its "items" array using $pull, and saves the list. Then, it redirects the user back to the custom list page.


  app.get("/about", function (req, res) {
    res.render("about");
  });

  app.listen(3005, function () {
    console.log("Server started on port 3005");
  });