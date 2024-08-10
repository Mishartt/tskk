const express = require('express')
const cors = require('cors')


const app = express()
const port = 8080

app.use(cors())
app.use(express.json())


let requestCount = 0;
let startTime = Date.now();

const rateLimiter = (req, res, next) => {
    const currentTime = Date.now();
  
    if (currentTime - startTime >= 1000) {
      startTime = currentTime;
      requestCount = 0;
    }
    
    requestCount++;
    console.log({requestCount})
    if (requestCount > 50) {
      console.log('Too Many Requests');
      res.status(429).send('Too Many Requests');
    } else {
      next();
    }
};

app.post('/api',rateLimiter,(req,res) => {
    console.log(req.body)
    if (!req.body.hasOwnProperty('index')) {
        console.log('Invalid data');
        return res.status(400).json({ error: 'Invalid data' });
    }

    const {index} = req.body

    let max = 1000;
    let min = 1;
    const delay = Math.floor(Math.random() * (max - min + 1)) + min
    console.log({delay})

    setTimeout(() =>{
        res.json({index,delay:(delay / 1000).toFixed(2)})
    },delay)

})



app.listen(port , () => {
   console.log(`Server running on ${port}`)
})


