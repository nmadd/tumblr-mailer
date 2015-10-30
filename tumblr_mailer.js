var fs = require('fs');
var ejs = require('ejs');
var EventEmitter = require("events").EventEmitter;
var ee = new EventEmitter();
var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill('_aiCNotIlGfLpFSIb5ubcQ');

// Authenticate tumblr via OAuth
var tumblr = require('tumblr.js');
var client = tumblr.createClient({
  consumer_key: 'GgzBApbtQ2mSF1pYlZe2np9HvkUaEculx3yv646yyZvO26Vg67',
  consumer_secret: 'fXkdfWkkStNgVdB6HuWdEf70T80iXB10gwOvUg49te6PlFZAnw',
  token: 'sFq2mvmi6KD7MI5HcsZJSLImv0aIXhdbjGRwI1xWxVkqk60PNE',
  token_secret: '6kFGkmzE8yuQCoxEdFehRt5k5rQxLbMZWhME1ZulWHXxmDhM8s'
});

//Holds latest posts
var latestPosts = [];

//Gets most recent blog posts, pushes them to latestPosts array, and emits the 'triggerTemplate' event
client.posts('nmadd.tumblr.com', function(err, blog){
  //Loops through all posts, if post less than a week old pushes post to latestPosts array
  blog.posts.forEach(function(post){
  	//var i = new Date().toISOString().slice(0, -14);
  	var postDate = post.date.slice(0, -13)
  	var o = new Date();
o.setDate(o.getDate() - 7);
var oneWeekAgo = o.toISOString().slice(0, -14);
  	 if(postDate > oneWeekAgo){
  		latestPosts.push(post)
  	}
  })
  ee.emit('triggerTemplate')
})


var csvFile = fs.readFileSync('friend_list.csv', 'utf8');
var emailTemplate = fs.readFileSync('email_template.ejs', 'utf-8')

//Counts rows in CSV file
var countRows = function(csvArr){
	return (csvArr.length - 4)/4
};

//Parses out CSV and returns as object
function csvParse(csvFile){
	var csvArr = csvFile.split(/,|\n/);
	var rows = countRows(csvArr);
	var result = [];
	for(var i =1; i < rows +1; i++){
		var obj ={};
		for (var j = 0; j < 4; j++){
	    		obj[csvArr[j]] = csvArr[i *4 + j];
	    	}
		result.push(obj);
	}
	return result;
}

//Stores parsed CSV; object of friiends' contact info
var friends = csvParse(csvFile);
//console.log(friends)

//Once 'latestPosts' array is populated, the temple event fires and the template is built
ee.on('triggerTemplate', buildTemplate)


//Builds template and sends emails fro each template
function buildTemplate(){
	//EJS template rendering
	friends.forEach(function(element){
		var name = element['firstName'];
		var monthsSince = element['numMonthsSinceContact'];
            //var emailAddress = element['emailAddress'];
		var templateCopy = emailTemplate;

		var customizedTemplate = ejs.render(emailTemplate,  { firstName: name,  
	                  numMonthsSinceContact: monthsSince, latestPosts: latestPosts
	                });
		//console.log(customizedTemplate);
		sendEmail(name, element['emailAddress'], 'Nate', 'ncmaddrey@gmail.com', 'Test', customizedTemplate)
	})
}


//Send email function
function sendEmail(to_name, to_email, from_name, from_email, subject, message_html){
    var message = {
        "html": message_html,
        "subject": subject,
        "from_email": from_email,
        "from_name": from_name,
        "to": [{
                "email": to_email,
                "name": to_name
            }],
        "important": false,
        "track_opens": true,    
        "auto_html": false,
        "preserve_recipients": true,
        "merge": false,
        "tags": [
            "Fullstack_Tumblrmailer_Workshop"
        ]    
    };
    var async = false;
    var ip_pool = "Main Pool";
    mandrill_client.messages.send({"message": message, "async": async, "ip_pool": ip_pool}, function(result) {
        // console.log(message);
        // console.log(result);   
    }, function(e) {
        // Mandrill returns the error as an object with name and message keys
        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
        // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
    });
 }


/*
//Use 'replace' to create basic templating 
friends.forEach(function(element){
	var name = element['firstName'];
	var monthsSince = element['numMonthsSinceContact'];
	var templateCopy = emailTemplate;
	templateCopy = templateCopy.replace(/FIRST_NAME/gi, name).replace(/NUM_MONTHS_SINCE_CONTACT/gi, monthsSince);
	console.log(templateCopy);
})
*/




