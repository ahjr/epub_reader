const WWW_BASE = "../www";
const BOOKSHELF = "js/bibi/bib/bookshelf";
const TIMEOUT = 10;			// Time (in seconds) to wait after bookshelf directory change to rebuild books array

var express = require('express'),
	cors	= require('cors'), 
	path 	= require('path'),
	fs 		= require('fs'),
	xml2js 	= require('xml2js');

var app = express();
// Allow access from our website
var corsOptions = {
	origin: "http://192.168.1.30:9090",
	optionsSuccessStatus: 200
};
var parser = new xml2js.Parser();
// Get rid of the relative path
var basedir = path.resolve(__dirname, WWW_BASE, BOOKSHELF);

// Find files in a given directory tree based on regex filter
//
// startPath: Path to search
// filter: Regex of files to find
// callback: Function to run when a matching file is found
//
function findFileInDir(startPath, filter, callback){
    if (!fs.existsSync(startPath)){
        console.log("Directory not found: ", startPath);
        return;
    }

    var files = fs.readdirSync(startPath);
    for(var i = 0; i < files.length; i++){
        var filename = path.join(startPath, files[i]);
        var stat = fs.lstatSync(filename);
        if (stat.isDirectory()){
            findFileInDir(filename, filter, callback); // recurse
        } else if (filter.test(filename)) {
        	callback(filename);
        }
    };
};

function findKey(filter, obj, results) {
	// Find a key in a deep object, i.e. parsed XML doc
	if (typeof obj == "object") {
		var keys = Object.keys(obj);
		for (var i = keys.length - 1; i >= 0; i--) {
			if (filter.test(keys[i])) {
				results.push(obj[keys[i]]);
			}
			results = findKey(filter, obj[keys[i]], results)
		}
	} 

	return results;
}

function getDirs(dir) {
	return fs.readdirSync(dir)
				.filter(function(file) {
 			   		return fs.statSync(path.join(dir, file)).isDirectory();
				});
}

function getData(pattern, tree) {
	var results = findKey(pattern, tree, []);

	if (typeof results[0][0] === "object") {
		return results[0][0]._;
	} else if (typeof results[0][0] === "string") {
		return results[0][0];
	} else {
		return null;
	}

}

function buildBook(bookDir, callback){
	findFileInDir(path.join(basedir, bookDir), /\.opf$/, function(filename){
		var book = {};
		book.dir = this.bookDir;
		/* Parse the .opf for Book name, author, and cover image */
		fs.readFile(filename, function(err, data) {
			parser.parseString(data, function(err, result){
				var metadata = findKey(/metadata/, result, []);
				book.title = getData(/title/, metadata[0]);
				book.author = getData(/creator/, metadata[0]);
				// Cover image unused, so taking this out for now
				var manifest = findKey(/manifest/, result, []);
				var metaCover = metadata[0][0].meta.filter(function(obj) {
					return obj.$.name === "cover";
				})[0].$.content;
				// book.cover_img = path.join(path.dirname(this.filename), manifest[0][0].item.filter(function(obj){
				book.cover_img = path.join(BOOKSHELF, path.dirname(path.relative(basedir, filename)), manifest[0][0].item.filter(function(obj){
					return obj.$.id === metaCover;
				})[0].$.href);
				callback(book);
			}.bind({filename: this.filename}));
		}.bind({filename: filename}));
	}.bind({bookDir: bookDir}));
}

function buildBookArray(i, bookDirs, books) {
	if (i < bookDirs.length) {
		buildBook(bookDirs[i], function(book) {
			books.push(book);
			console.log("\x1b[1m\x1b[32m[Book added]\x1b[0m "+ book.title);
			books = buildBookArray(i+1, bookDirs, books);
		});
	} 
	return books;
}

var fsTimeout;
var books = buildBookArray(0, getDirs(basedir), []);
fs.watch(basedir, function(){
	if(!fsTimeout) {
		console.log("\x1b[1m\x1b[35mBookshelf directory changed\x1b[0m");
		fsTimeout = setTimeout(function() {
						books = buildBookArray(0, getDirs(basedir), []);
						fsTimeout = 0;
					}, TIMEOUT*1000);
	}
});

var port = process.env.PORT || 9091;
if (app.listen(port)) {
	console.log("\x1b[1m\x1b[33mListening on port " + port + "\x1b[0m");
} else {
	console.log("\x1b[1m\x1b[31m[Error]\x1b[0m Unable to start server");
	process.exit(1);
}

app.get('/', cors(corsOptions), function(req, res) {
	res.json(books);
	var userIP = req.socket.remoteAddress || "0.0.0.0"; 
	console.log("\x1b[1m\x1b[34m[" + userIP + "]\x1b[0m All Books Requested");
});

// Currently not in use
// app.get('/book/:id', cors(corsOptions), function(req, res) {
// 	if(books.length <= req.params.id || req.params.id < 0) {
//     	res.statusCode = 404;
// 		console.log("\x1b[1m\x1b[31m[Error]\x1b[0m Book not found: " + req.params.id);
//     	return res.send('Error 404: No book found');
//   	}  
// 	var b = books[req.params.id];
//   	res.json(b);
// 	console.log("\x1b[1m\x1b[36m[Book Requested]\x1b[0m " + b.title);

// });
