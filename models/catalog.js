// DB Connection
const pool = require('../db');

var item = require('../models/item');
//list to be filled with item objects from item.js in models
var itemsList = [];

//below is an example of using the constructor of the object
// item.constructor(item_id, discriminator, properties (as an object));

//Get list of catalog items
module.exports.getCatalog = async function() {
    try {
        const client = await pool.connect();
        let result = [];
        const resultBook = await client.query('SELECT * FROM books ORDER BY item_id ASC');
        const resultMagazine = await client.query('SELECT * FROM magazines ORDER BY item_id ASC');
        const resultMovie = await client.query('SELECT * FROM movies ORDER BY item_id ASC');
        const resultMusic = await client.query('SELECT * FROM music ORDER BY item_id ASC');

        result.resultBooks = { 'resultBooks': (resultBook) ? resultBook.rows : null};
        result.resultMagazines = { 'resultMagazines': (resultMagazine) ? resultMagazine.rows : null};
        result.resultMovies = { 'resultMovies': (resultMovie) ? resultMovie.rows : null};
        result.resultMusics = { 'resultMusics': (resultMusic) ? resultMusic.rows : null};
        client.release();
        //console.log(list);
        return await result;
    } catch (err) {
        console.error(err);
        res.render('error', { error: err });
    }
};

// Insert new item into db
// insert into the items table dirst, then use the PSQL function to retrieve
// the items_item_id_seq (item_id) that was just inserted to create a new item.
module.exports.insertNewItem = async function(newItem, discriminator) {
    try {
        const client = await pool.connect();
        let result;
        switch (discriminator) {
            case "Book":
                client.query("INSERT INTO Items (discriminator) VALUES ('Book');");
                result = await client.query(
                    "INSERT INTO books (item_id , pages ," +
                    "title, author, format, publisher, language, isbn10, isbn13)" +
                    " SELECT select_id, "+
                    "" + newItem.pages + ", " +
                    "'" + newItem.title + "', " +
                    "'" + newItem.author + "', " +
                    "'" + newItem.format + "', " +
                    "'" + newItem.publisher + "', " +
                    "'" + newItem.language + "', " +
                    newItem.isbn10 + ", " +
                    newItem.isbn13 +
                    " FROM (SELECT CURRVAL('items_item_id_seq') select_id)q;"
                );
                break;
            case "Magazine":
                client.query("INSERT INTO Items (discriminator) VALUES ('Magazine');");
                result = await client.query(
                    "INSERT INTO magazines (item_id, " +
                    "title, publisher, language, isbn10, isbn13)" +
                    " SELECT select_id, "+
                    "'" + newItem.title + "', " +
                    "'" + newItem.publisher + "', " +
                    "'" + newItem.language + "', " +
                    "'" + newItem.isbn10 + "', " +
                    "'" + newItem.isbn13 + "' " +
                    "FROM (SELECT CURRVAL('items_item_id_seq') select_id)q;"
                );
                break;
            case "Movie":
                client.query("INSERT INTO Items (discriminator) VALUES ('Movie');");
                result = await client.query(
                    "INSERT INTO movies (item_id, run_time, title, " +
                    "director, producers, actors, language, dubbed, subtitles, release_date) " +
                    "SELECT select_id, "+
                    newItem.run_time + ", " +
                    "'" + newItem.title + "', " +
                    "'" + newItem.director + "', " +
                    "'" + newItem.producers + "', " +
                    "'" + newItem.actors + "', " +
                    "'" + newItem.language + "', " +
                    "'" + newItem.dubbed + "', " +
                    "'" + newItem.subtitles + "', " +
                    "'" + newItem.release_date + "' " +
                    "FROM (SELECT CURRVAL('items_item_id_seq') select_id)q;"
                );
                break;
            case "Music":
                client.query("INSERT INTO Items (discriminator) VALUES ('Music');");
                result = await client.query(
                    "INSERT INTO music (item_id, " +
                    "type, title, artist, label, release_date, asin)" +
                    " SELECT select_id, "+
                    "'" + newItem.type + "', " +
                    "'" + newItem.title + "', " +
                    "'" + newItem.artist + "', " +
                    "'" + newItem.label + "', " +
                    "'" + newItem.release_date + "', " +
                    "'" + newItem.asin + "' " +
                    "FROM (SELECT CURRVAL('items_item_id_seq') select_id)q;"
                );
                break;
            default:
                result = null;
                break;
        }
        client.release();
    } catch (err) {
        console.error(err);
    }
};

/**
 * getItem(item_id, discriminator)
 **/
module.exports.getItem = async function(item_id) {
    try {
        const client = await pool.connect()
        let result;
        let discriminator = await this.getDiscriminator(item_id);
        switch(discriminator) {
            case "Book":
                result = await client.query("SELECT * FROM books WHERE item_id = ($1)", [item_id]);
                break;
            case "Magazine":
                result = await client.query("SELECT * FROM magazines WHERE item_id = ($1)", [item_id]);
                break;
            case "Movie":
                result = await client.query("SELECT * FROM movies WHERE item_id = ($1)", [item_id]);
                break;
            case "Music":
                result = await client.query("SELECT * FROM music WHERE item_id = ($1)", [item_id]);
                break;
            default:
                result = null;
                break;
        }
        const results = { 'results': (result) ? result.rows : null};
        client.release();
        return await results;
    } catch (err) {
        console.error(err);
    }
}

//Getter for discriminator
module.exports.getDiscriminator = async function(item_id) {
    try {
        const client = await pool.connect();
        let result = await client.query(
            "SELECT discriminator FROM Items WHERE item_id=$1;", [item_id]
        );
        var resultJSON = { 'result': (await result) ? await result.rows : null};
        client.release();
        return await resultJSON.result[0].discriminator;
    } catch (err) {
        console.error(err);
    }
}

// getNewItem for update
// get a new item passed in from the HTML form
// based on the item_id
module.exports.getNewItem = async function(item_id, req) {
    let newItem;
    const discriminator = await this.getDiscriminator(item_id);
    // console.log("getNewItem DISCRIMINATOR: " + discriminator);
    try {
        switch(discriminator) {
            case "Book":
                newItem = await {
                    "title": req.body.title,
                    "author": req.body.author,
                    "format": req.body.format,
                    "pages": req.body.pages,
                    "publisher": req.body.publisher,
                    "language": req.body.language,
                    "isbn10": req.body.isbn10,
                    "isbn13": req.body.isbn13,
                    "loanable": req.body.loanable,
                    "loan_period": req.body.loan_period
                };
                break;
            case "Magazine":
                newItem = await {
                    "title": req.body.title,
                    "publisher": req.body.publisher,
                    "language": req.body.language,
                    "isbn10": req.body.isbn10,
                    "isbn13": req.body.isbn13,
                    "loanable": req.body.loanable,
                    "loan_period": req.body.loan_period
                };
                break;
            case "Movie":
                newItem = await {
                    "title": req.body.title,
                    "Publisher": req.body.director,
                    "producers": req.body.producers,
                    "language": req.body.language,
                    "dubbed": req.body.dubbed,
                    "subtitles": req.body.subtitles,
                    "actors": req.body.actors,
                    "release_date": req.body.release_date,
                    "run_time": req.body.run_time,
                    "loanable": req.body.loanable,
                    "loan_period": req.body.loan_period
                };
                break;
            case "Music":
                newItem = await {
                    "title": req.body.title,
                    "artist": req.body.artist,
                    "type": req.body.type,
                    "label": req.body.label,
                    "release_date": req.body.release_date,
                    "asin": req.body.asin,
                    "run_time": req.body.run_time,
                    "loanable": req.body.loanable,
                    "loan_period": req.body.loan_period
                };
                break;
            default:
                newItem = null;
                console.log("NO OBJECT FOUND");
                break;
        }
        return await newItem;
    } catch (err) {
        console.error(err);
    }
}

// getNewItem for insert
// get a new item passed in from the HTML form
// based on the discriminator type
module.exports.getNewItemForInsert = async function(discriminator, req) {
    let newItem;
    try {
        switch(discriminator) {
            case "Book":
                newItem = await {
                    "title": req.body.title,
                    "author": req.body.author,
                    "format": req.body.format,
                    "pages": req.body.pages,
                    "publisher": req.body.publisher,
                    "language": req.body.language,
                    "isbn10": req.body.isbn10,
                    "isbn13": req.body.isbn13
                };
                break;
            case "Magazine":
                newItem = await {
                    "title": req.body.title,
                    "publisher": req.body.publisher,
                    "language": req.body.language,
                    "isbn10": req.body.isbn10,
                    "isbn13": req.body.isbn13
                };
                break;
            case "Movie":
                newItem = await {
                    "title": req.body.title,
                    "director": req.body.director,
                    "producers": req.body.producers,
                    "actors": req.body.actors,
                    "language": req.body.language,
                    "dubbed": req.body.dubbed,
                    "subtitles": req.body.subtitles,
                    "release_date": req.body.release_date,
                    "run_time": req.body.run_time
                };
                break;
            case "Music":
                newItem = await {
                    "title": req.body.title,
                    "type": req.body.type,
                    "artist": req.body.artist,
                    "label": req.body.label,
                    "release_date": req.body.release_date,
                    "asin": req.body.asin
                };
                break;
            default:
                newItem = null;
                console.log("NO OBJECT FOUND");
                break;
        }
        return await newItem;
    } catch (err) {
        console.error(err);
    }
}

// updateItem to database;
module.exports.updateItem = async function(newItem, item_id) {
    try {
        const client = await pool.connect();
        let result;
        let discriminator = await this.getDiscriminator(item_id);
        // console.log(discriminator);
        switch (discriminator) {
            case "Book":
                result = await client.query(
                    "UPDATE books SET " +
                    "title = '"+ newItem.title + "', " +
                    "author = '" + newItem.author + "', " +
                    "format = '" + newItem.format + "', " +
                    "pages = " + newItem.pages + ", " +
                    "publisher = '" + newItem.publisher + "', " +
                    "language = '" + newItem.language + "', " +
                    "isbn10 = " + newItem.isbn10 + ", " +
                    "isbn13 = " + newItem.isbn13 + ", " +
                    "loanable = '" + newItem.loanable + "', " +
                    "loan_period = " + newItem.loan_period +
                    " WHERE item_id = ($1);", [item_id]
                );
                // console.log("BOOK SQL");
                break;
            case "Magazine":
                result = await client.query(
                    "UPDATE magazines SET " +
                    "title = '"+ newItem.title + "', " +
                    "publisher = '" + newItem.publisher + "', " +
                    "language = '" + newItem.language + "', " +
                    "isbn10 = " + newItem.isbn10 + ", " +
                    "isbn13 = " + newItem.isbn13 + ", " +
                    "loanable = '" + newItem.loanable + "', " +
                    "loan_period = " + newItem.loan_period +
                    " WHERE item_id = ($1);", [item_id]
                );
                // console.log("MAGAZINE SQL");
                break;
            case "Movie":
                result = await client.query(
                    "UPDATE movies SET " +
                    "title = '"+ newItem.title + "', " +
                    "director = '" + newItem.director + "', " +
                    "producers = '" + newItem.producers + "', " +
                    "language = '" + newItem.language + "', " +
                    "dubbed = '" + newItem.dubbed + "', " +
                    "subtitles = '" + newItem.subtitles + "', " +
                    "actors = '" + newItem.actors + "', " +
                    "release_date = '" + newItem.release_date + "', " +
                    "run_time = " + newItem.run_time + ", " +
                    "loanable = '" + newItem.loanable + "', " +
                    "loan_period = " + newItem.loan_period +
                    " WHERE item_id = ($1);", [item_id]
                );
                // console.log("MOVIE SQL");
                break;
            case "Music":
                result = await client.query(
                    "UPDATE music SET " +
                    "title = '"+ newItem.title + "', " +
                    "artist = '" + newItem.artist + "', " +
                    "type = '" + newItem.type + "', " +
                    "label = '" + newItem.label + "', " +
                    "release_date = '" + newItem.release_date + "', " +
                    "asin = '" + newItem.asin + "', " +
                    "loanable = '" + newItem.loanable + "', " +
                    "loan_period = " + newItem.loan_period +
                    " WHERE item_id = ($1);", [item_id]
                );
                // console.log("MUSIC SQL");
                break;
            default:
                result = null;
                // console.log("NO SQL");
                break;
        }
        client.release();
    } catch (err) {
        console.error(err);
    }
}
