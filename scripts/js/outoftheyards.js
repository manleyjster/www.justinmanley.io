var _ 				= require('lodash'),
 	xmlbuilder 		= require('xmlbuilder'),
 	Q 				= require('q'),
 	moment 			= require('moment'),
 	htmlEntities 	= require('html-entities').XmlEntities,
 	util  			= require('./util');

function generateFeed(xml) {
	var items = xml.feed.entry,
		root = xmlbuilder.create('root', { headless: true }),
		entity = new htmlEntities();

	return _.map(items, function(item) {
		var event = root.ele('div', { class: 'event outoftheyards-event'}),
			time = moment(item.published[0]),
			/* time is an ISO-8601 string, so moment understands it natively. */
			humanReadableTime = time.format(util.TIME_FORMAT),
			summary = item.summary[0]._.replace('[&#8230;]', ' &#8230;')

		event.ele('div', { class: 'time' })
			.text(humanReadableTime);


		event.ele('div', { class: 'title' })
			.ele('a', { href: 'http://outoftheyards.com' })
				.text('justinmanley')
				.up()
			.ele('span')
				.text(' published ')
				.up()
			.ele('a', { href: item.link[0].$.href })
				.text(entity.decode(item.title[0]._));

		event.ele('div', { class: "details" })
			.text(entity.decode(summary));

		return {
			timestamp: time.format(), 
			html: event.toString({ pretty: true })
		};
	});
}

module.exports = {
	feed: function() {
		return util.readYAML('data/config/feedUrls.yml')
			.then(function(config) {
				return util.get(config.outoftheyards)
			})
			.then(util.parseXML)
			.then(generateFeed);
	}
}
