require('dotenv').config();
const express = require('express');
const pool = require('./db.js');
const bodyparser = require('body-parser');
const app = express();
const multer = require('multer');
const cors = require('cors');  
const PORT = process.env.PORT || 8000;
const path = require('path');



app.use((req,res,next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "*");
    res.header("Access-Control-Allow-Headers", "*");
    next();
})

app.use(bodyparser.json());
const allowed = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
app.use(cors({
  origin: ["http://localhost:5173", "https://your-netlify-site.netlify.app"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.get('/health', (req, res) => res.json({ ok: true }));

console.log("DATABASE_URL:", process.env.DATABASE_URL);

app.get('/', async (req, res) =>{
    res.send("<center><h1> Menu API </h1></center>");
});

//--------------------------Admin----------------------------------
app.get('/admin', async (req, res) => {
    try{
        const result = await pool.query("select * from admin");
        res.json({admin:result.rows});
    }catch(err){
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});
//-------------------------Menu Table APIs------------------------------
app.get('/mainmenu', async (req, res) => {
    try{
        const result = await pool.query("select menu_name, menu_price, quantity, grp_name, img_url from menu, qty_mast, category where menu.qid = qty_mast.qid and menu.cid = category.cid;");
        res.json({menu:result.rows});
    }catch(err){
        console.error(err.message);
        res.status(500).send("Server Error.");
    }
});

app.get('/menu', async (req, res) => {
    try{
        const result = await pool.query("select * from menu");
        res.json({menu:result.rows});
    }catch(err){
        console.error(err.message);
        res.status(500).send("Server Error.");
    }
});

// app.post('/addmenu', async(req,res) =>{
//     try{
//         const {name, price, cid, qid, img_url} = req.body;
//         const checkrecord = await pool.query("Select * from menu where menu_name = $1",[name]);
//         // console.log(checkrecord.rows.length);
//         // res.json(checkrecord.rows);
//         if(checkrecord.rows.length > 0){
//             return res.status(400).json({ message: "Menu already exists" });
//         }else{
//             const result =  await pool.query("Insert into menu(menu_name, menu_price, cid, qid, img_url)values($1, $2, $3, $4, $5) returning *",[name, price,cid, qid, img_url]);
//             res.json({message:"Menu added Successfully.",data:result.rows});
//         }
//     }catch(err){
//         console.error(err.message);
//         res.status(500).send("Server Error");
//     }
// });
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Serve uploaded images
app.use(express.urlencoded({ extended: true }));


// Setup multer storage
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });
app.post('/addmenu', upload.single('img'), async (req, res) => {
  try {
    const { name, price, cid, qid } = req.body;
    const img_url = req.file ? req.file.filename : null;

    const checkrecord = await pool.query("SELECT * FROM menu WHERE menu_name = $1", [name]);

    if (checkrecord.rows.length > 0) {
      return res.status(400).json({ message: "Menu already exists" });
    } else {
      const result = await pool.query(
        "INSERT INTO menu(menu_name, menu_price, cid, qid, img_url) VALUES($1, $2, $3, $4, $5) RETURNING *",
        [name, price, cid, qid, img_url]
      );
      res.json({ message: "Menu added Successfully.", data: result.rows });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});




app.get('/menuBYid', async(req,res) => {
    try{
        const { id } = req.body;
        // const ans = await pool.query("select * from menu");
        const ans = await pool.query("Select * from menu where mid = $1",[id]);
        // console.log(ans.rows.length)
        if(ans.rows.length > 0){
            const result = await pool.query("Select * from menu where mid = $1",[id]);
            res.json({"menu":ans.rows});   
        }else{
            res.json({message:"Query Not Executed"});
        }
    }catch(err){
        console.error(err.message);
        res.status(500).send("Server Error");``
    }
});

app.delete('/delmenu', async(req,res) =>{
    try{
        const {id} = req.body;
        const checkid = await pool.query("select * from menu where mid = $1",[id]);
        if(checkid.rows.length > 0){
            await pool.query("Delete from menu where mid = $1",[id]);
            res.json({Deleted_ID:id});
        }else{
            res.status(400).json({error:"ID no. "+id+" is not present in the DataBase"});
        }
    }catch(err){
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

app.put('/updatemenu', async (req,res) =>{
    try{
        console.log("Request Body:", req.body);
        const {mid,name,price,qid,cid} = req.body;
        const checkid = await pool.query("select * from menu where mid = $1",[mid]);

        if(checkid.rows.length > 0){
            const result = await pool.query("update menu set menu_name=$1,  menu_price=$2, cid=$3, qid=$4 where mid=$5 returning *",[name,price,cid,qid,mid])
            res.json({message:"Id no "+mid+" Updated Successfully",data:result.rows});
        }else{
            res.json("Id "+mid+" is not present in the DataBase");
        }
    }catch(err){
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});
//-----------menu  (END)-----------------------------------


//----------------------Menu Category--------------------------
app.get('/menucategory', async(req,res) =>{
    try{
        const result = await pool.query("Select * from category");
        res.json({category:result.rows});
    }catch(err){
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

app.get('/catBYid', async(req,res) =>{
    try{
        const { cid } = req.body;
        const result = await pool.query("Select * from category where cid = $1",[cid]);
        if(result.rows.length > 0){
           
            res.json(result.rows);
        }else{
            res.json({message:"Id "+cid+" is not present in the DataBase"});
        }
    }catch(err){
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

app.post('/addCat', async (req, res) =>{
    try{
        const {grp_name} = req.body;
        const checkrecord = await pool.query("Select * from category where grp_name = $1",[grp_name]);

        if(checkrecord.rows.length > 0){
            res.json({message:grp_name+" Already Exists."});
        }else{
            const result = await pool.query("insert into category(grp_name)values($1) returning *",[grp_name]);
            res.json({message:"New category added", data:result.rows});
        }
    }catch(err){
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

app.delete('/delCat', async (req, res) =>{
    try{
        const {cid} = req.body;
        const checkid = await pool.query("select * from category where cid = $1",[cid]);

        if(checkid.rows.length > 0){
            const result = await pool.query("delete from category where cid = $1",[cid]);
            res.json({message:"Category no: "+cid+" deleted.",data:result.rows});
        }else{
            res.json({message:cid+" is not present in DB"});
        }
    }catch(err){
        console.error(err.message);
        res.status(500).send("Server Error")
    }
});

app.put('/updateCat', async (req,res) =>{
    try{
        const {grp_name, cid} = req.body;
        const checkid = await pool.query("Select * from category where cid = $1",[cid]);

        if(checkid.rows.length > 0){
            const result = await pool.query("Update category set grp_name = $1 where cid = $2 returning *",[grp_name, cid]);
            res.json({message:"Id no.: "+cid+" Updated Successfully", data:result.rows});
        }else{
            res.json({message:"Id no.: "+cid+" is not present in the DB"});
        }
    }catch(err){
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});
//-------------------------Menu Category  (END)---------------------------------


//------------------------Quantity-----------------------------------

app.get('/qty', async(req, res) =>{
    try{
        const result = await pool.query("Select * from qty_mast");
        res.json({data:result.rows});
    }catch(err){
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

app.post('/addqty', async(req, res) =>{
    try{
        const {qid,qty} = req.body;
        const checkrecord = await pool.query("Select  * from qty_mast where quantity = $1",[qty]);
        if(checkrecord.rows.length > 0){
            res.json({message:"Quantity "+qty+" Already Exists"});
        }else{
            const result = await pool.query("insert into qty_mast(qid,quantity)values($1, $2) returning *",[qid,qty]);
            res.json({message:"Added Successfully",data:result.rows});
        }
    }catch(err){
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

app.delete('/delqty', async(req,res) =>{
    try{
        const {qid} = req.body;
        const checkid = await pool.query("Select * from qty_mast where qid = $1",[qid]);
        if(checkid.rows.length > 0){
            const result = await pool.query("delete from qty_mast where qid = $1",[qid]);
            res.json({message:qid+" Deleted Successfully"});
        }else{
            res.json({message:qid+" is not present in DB"});
        }
    }catch{
    console.error(err.message);
    res.status(500).send("Server Error");
    }
});

//--------------------Quantity(END)------------------------------------------

app.listen(PORT, () =>{
    console.log("Server Listning on localhost:8000");
});