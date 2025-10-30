import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import pg from "pg";
import axios from "axios";

const app = express();

const port = 3000;

// const API = https://covers.openlibrary.org/b/isbn/0385472579-S.jpg

const db = new pg.Client({
    user: "postgres",
    password: "pruthvi",
    host: "localhost",
    port: 5432,
    database: "Books",
});

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

db.connect();

const bookDetails = [];

app.get("/", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM books_summary ORDER BY id ASC") //select all details of books from book_summary 
        const data = result.rows //select only needed details from result. (id:1,head:,summary:,date:,ratings:)
        // console.log(data)
        const isbn = data.map((book => book.isbn))
        // console.log(isbn)
        // const response = await axios.get("https://covers.openlibrary.org/b/isbn/0385472579-S.jpg")

        res.render("index.ejs", { data: data }) //rendering all data which comes from server .
    } catch (err) {
        console.log(err)
    }

});

// render form if user click on add book button.
app.get("/form", (req, res) => {
    res.render("form.ejs")
});

//when user use search bar for seaching particular book.
app.post("/search", async (req, res) => {
    const search_book = req.body.search_book.trim().toLowerCase(); //extract search book and makes it lower case.
    // console.error(search_book);
    try { //select all data from book summary on user search book and based on head column.
        const result = await db.query(
            "SELECT * FROM books_summary WHERE head ILIKE '%' || $1 || '%'", //select all data where particular head.here we use like for mak ui userfriendly.
            [search_book.toLowerCase()] //makes it lower case.
        );

        const find_book = result.rows;
        // console.error(find_book);

        if (find_book.length === 0) { //if find_book equal to 0 then show error with code,message and url.
            res.status(404).render("error.ejs", {
                code: 404,
                message: "Book not found.",
                imageUrl: "/images/animated-3D-404-not-found-page-error.gif" // Add your custom image/animation in public folder
            });
        } else {
            res.render("search.ejs", { data: find_book });//and books are available then render it.
        }
    } catch (err) {
        console.error(err);
        res.status(500).render("error.ejs", {
            code: 500,
            message: "Internal Server Error.",
            imageUrl: "/images/200.webp"
        });
    }
});



//add new book on database.
app.post("/new", async (req, res) => {//extract all needed value.
    const heading = req.body.head
    const summary = req.body.summary
    const date = req.body.date
    const ratings = req.body.ratings
    const isbn = req.body.isbn

    try {//insert into book summary table with particular value.
        const result = await db.query("INSERT INTO books_summary(head,summary,ratings,date,isbn) VALUES($1,$2,$3,$4,$5)", [heading, summary, ratings, date, isbn])
        res.redirect("/")
    } catch (err) {
        //if any error occure then show this all things.
        console.log(err)
        res.status(500).render("error.ejs", { code: 500, message: "Books are not added succsecfully, try again later.", imageUrl: "/images/200.webp" })
    }
});

//edit books summary
app.get("/edit/:id", async (req, res) => { //get route with particular id which user want to edit.
    try {
        const result = await db.query("SELECT * FROM books_summary") //select all data from book_summary.
        const data = result.rows
        // console.log(data)
        const id = parseInt(req.params.id) //convert extracted id in to integer which are string.
        // console.log(id)

        const details = data.find((data) => data.id === id) //extract exact match from data means which books user want to edit based on id.
        // console.log(details)
        res.render("edit.ejs", { details: details }) // render at edit.ejs
    } catch (err) {
        res.status(500).render("error.ejs", { code: 500, message: "internal srver error.", imageUrl: "/images/200.webp" })
    }

});

app.post("/edit/:id", async (req, res) => {

    const id = parseInt(req.params.id) //extract id from route and makes it integer.

    const heading = req.body.heading // extract all needed stuff for updating data in database.
    const summary = req.body.summary
    const isbn = parseInt(req.body.isbn) //extract isbn no and makes it integer.

    const ratings = parseFloat(req.body.ratings) //extract ratings and makes it floating point number.
    // console.log(heading)
    try { // insert updated data in to database.
        const result = await db.query("UPDATE books_summary set head = $1, summary = $2 , ratings = $3 , isbn = $4 where id = $5", [heading, summary, ratings, isbn, id])
        res.redirect("/")
    } catch (err) {
        res.status(500).render("error.ejs", { code: 500, message: "internal srver error.", imageUrl: "/images/200.webp" })

    }
});

app.post("/delete/:id", async (req, res) => {

    const id = parseInt(req.params.id)
    console.log(id)
    const result = await db.query("DELETE FROM books_summary WHERE id = $1", [id])

    res.redirect("/")
})


app.listen(port, () => {
    console.log(`server start at port ${port}`)
});
