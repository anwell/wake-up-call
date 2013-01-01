"use strict";
var express = require('express');
var schedule = require('node-schedule');
var https = require('https');
var qs = require('querystring');

//necessary to use the request.body property to read queries
app.use(express.bodyParser());

//The API and AUTH keys for Twilio are config variables in heroku
var api = process.env.TWILIO_SID;
var auth = process.env.TWILIO_AUTH;

//an object literal with key value pairs of phone numbers and the right answer
// #TODO remove key/values after the call has ended
var answers = {PHONE_NUMBER: "answer"};

var callPerson = function(phone) {
    var postdata = qs.stringify({
        'From' : '+14254411117',
        'To' : phone,
        'Url' : 'http://wake-up-call.herokuapp.com/'
    });

    var options = {
        host: 'api.twilio.com',
        path: '/2010-04-01/Accounts/' + api + '/Calls.xml',
        port: 443,
        method: 'POST',
        headers: {
            'Content-Type' : 'application/x-www-form-urlencoded',
            'Content-Length' : postdata.length
        },
        auth: api + ':' + auth
    };

    var request = https.request(options, function(res){
        res.setEncoding('utf8');
        res.on('data', function(chunk){
            console.log('Response: ' + chunk);
        })
    })

    request.write(postdata);
    request.end();
}

var app = express.createServer(express.logger());
app.all('/', function(request, response) {

    if (request.body.hasOwnProperty("CallSid") && !request.body.hasOwnProperty("Digits")) {
        //generating a random math problem
        var num1 = Math.floor(Math.random()*8 +3);
        var num2 = Math.floor(Math.random()*39 +11);
        var answer = num1 * num2;
        answer = parseInt(answer);                                      
        var titles = "<Response>";
        //using the gather TwiML to receive keypad input
        titles += "<Gather timeout='30' finishOnKey='*'>";
        titles += ("<Say>" + "Good Morning. What is " + num1 + " times " + num2 + "</Say>");
        titles += "</Gather>";
        titles += "</Response>";
        response.send(titles);

        answers[request.body.From] = answer;
        //checking if the answer was answered correctly, meaning the answer would be 0
    } else if (request.body.hasOwnProperty("CallStatus") && (request.body.CallStatus == "completed" || request.body.CallStatus == "canceled" ) && answers[request.body.From] > 0){
        callPerson(request.body.From); //#TODO right now this does not work
    }
 
    else {
        //checking if the request was an input
        if (request.body.hasOwnProperty("Digits")) {
            var input = request.body.Digits;
            input = parseInt(input);
            if (input === parseInt(answers[request.body.From], 10)) {
                var right = "<Response>";
                right += "<Say>" + "Good morning." + "</Say>";
                right += "</Response>";
                response.send(right);
                answers[request.body.From] = 0; // 0 means the answer was inputted correctly
            } else {
                var wrong = "<Response>";
                wrong += "<Say>" + "I'm sorry, that's wrong. This is what you entered." + input + "</Say>";
                wrong += "</Response>";
                response.send(wrong);
                console.log(input);
            }
        }
 
        else {
            var = "<Response>";
            dne += "<Say>" + "We didn't receive any input. Goodbye!" + "</Say>";
            dne += "</Response>";
            response.send("<Response><Say>We didn't receive any input. Goodbye!</Say></Response>");
        }
    }

    if (request.body.hasOwnProperty("Body")){
        var textMessage = request.body.Body;

        var locationOfSemicolon = textMessage.indexOf(":");

        var time = textMessage.charAt(locationOfSemicolon + 1) + textMessage.charAt(locationOfSemicolon + 2) + " " + textMessage.charAt(locationOfSemicolon - 2)  + textMessage.charAt(locationOfSemicolon - 1);

        console.log(time);
    }

    try{
        var personPhone = request.body.From;
        var j = schedule.scheduleJob(time + " * * *", function(){
            console.log("It's time.")
            // what to do when the alarm rings
            callPerson(personPhone);

        })
        console.log("successful cron job creation")
    } catch(ex) {
        console.log("cron job incorrectly formatted")
        //say how to format the text message

    }

    //response.send(200); //Right now not all requests are met with responses
});

//heroku assigns ports automatically
var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});