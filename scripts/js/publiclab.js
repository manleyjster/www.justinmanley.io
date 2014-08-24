#!/usr/bin/node

/*
 * Example:
 *     scripts/js/publiclab.js <filename>
 *     scripts/js/publiclab.js myfile.html
 */

var fs 			= require("fs"),
	marked 		= require("marked"),
	_ 			= require("lodash"),
	xmlbuilder 	= require("xmlbuilder"),
	Q 			= require("q"),
	htmlparser 	= require("htmlparser2"),
	moment		= require("moment"),
	xml2js 		= require("xml2js").parseString;

var	filename = process.cwd() + "/" + process.argv[2];

readFile(filename)
	.then(parseXML)
	.then(function(xml) {
		var items = xml.rss.channel[0].item;

		return Q.all(_.map(items, function(item) {
			return parseMarkdown(item.description[0]);
		}))
		.then(function(htmls) {
			return Q.all(_.map(htmls, parseHTML))
			.then(function(doms) {
				generateFeed(_.zip(items, htmls, doms));
			});
		});
	})
	.done();

function generateFeed(events) {

	var output = xmlbuilder.create('root', { headless: true });

	_.each(events, function(item) {

		var event = output.ele('div', { class: "event publiclab-event"}),
			time = moment(item[0].pubDate, 'ddd Do MMM YYYY hh:mm:ss Z'),
			humanReadableTime = time.format('MMMM DD, YYYY')

		/* Get header image, if it exists. */
		if (item[2][0].children[0].attribs) {
			var src = item[2][0].children[0].attribs.src;
			event
				.ele('div', { class: "thumbnail" })
				.ele('img', { src: src });
		}

		event.ele('div', { class: "time" })
			.text(humanReadableTime);

		event.ele('div', { class: "title" })
			.ele('a', { href: "http://publiclab.org/profile/justinmanley" })
			.text(item[0].author)
			.up()
			.ele('span').text(" published ")
			.up()
			.ele('a', { href: item[0].link })
			.text(item[0].title);

		// event.ele('div', { class: "details" })
		// 	.raw(item[1]);

		console.log(event.toString({ pretty: true }));

	});
}

function parseMarkdown(markdownString) {
	return Q.nfcall(marked, markdownString, { xhtml: true });
}

function parseXML(xmlString) {
	return Q.nfcall(xml2js, xmlString);
}

function readFile(filename) {
	var deferred = Q.defer(),
		data = '';

	process.stdin.setEncoding('utf-8');

	process.stdin.on('readable', function() {
		data += process.stdin.read();
	});

	process.stdin.on('end', function() {
		deferred.resolve(data);
	});

	return deferred.promise;
}

function parseHTML(htmlString) {
	var deferred = Q.defer(),
		handler, parser;

	handler = new htmlparser.DomHandler(function(err, dom) {
		if (err) {
			deferred.reject(err);
		} else {
			deferred.resolve(dom);
		}
	});

	parser = new htmlparser.Parser(handler);
	parser.write(htmlString);
	parser.done();

	return deferred.promise;
}