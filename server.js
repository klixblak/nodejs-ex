const http = require('http');
const express = require('express');
const app = express();


app.get('/weatherinfo:location', function(req, res)
        {
        const url = "http://api.openweathermap.org/data/2.5/weather?q=" + req.params.location + "&units=imperial&appid=7938d1ebc15262643719cfe6bb490b35";
        console.log("URL: " + url);
        
        var data = "";
        
        http.get(url, api_res =>
                 {
                 api_res.setEncoding("utf8");
                 let body = "";
                 api_res.on("data", data =>
                            {
                            body += data;
                            });
                 
                 api_res.on("end", () =>
                            {
                            body = JSON.parse(body);
                            
                            // did the passed location exist?
                            if (body.cod != '404')
                            {
                            // show the full results in the console
                            console.log(body);
                            //res.write(JSON.stringify(body));
                            
                            // create the specific JSON for the specialised response back to the caller
                            res.json({Location:body.name , WindSpeed:body.wind.speed*1.943844 , WindDirection:body.wind.deg , Temperature:body.main.temp , Overview:body.weather[0].main});
                            res.end();
                            }
                            });
                 
                 });
        })

app.listen(3000, function()
           {
           console.log('weather-cache is listening on port 3000')
           })

