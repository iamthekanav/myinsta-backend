const express=require("express");
let userDB= require("./db/userDB.json");
const fs=require("fs");
const { v4:  uuidv4 } = require('uuid');
const app=express();
const connection=require("./db/connection");
const passport=require("passport");
const GoogleStrategy=require("passport-google-oauth20");
const cookieSession = require("cookie-session");
const $=require("jquery");
const cors=require("cors");
const multer  = require('multer');
const bodyParser = require("body-parser");
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      if(file.fieldname=='postImage'){
          cb(null, 'public/posts');
      }
      else{
          cb(null, 'public')
      }
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now()+".jpeg");
    }
  })
   
const upload = multer({ storage: storage });
//API logic
app.use(express.json());
app.use(express.static('public'));
app.use(cors());


//ADD A NEW USER
const insertIntoDb= (user)=>{
    return new Promise( (resolve,reject)=>{
        let uid=user.uid;
        let name = user.name;
        let phone=user.phone;
        let email=user.email;
        let bio=user.bio;
        let handle=user.handle;
        let isPub=user.is_public;
        let pImage=user.pImage;
        let gId=user.gId;
        let sql=`INSERT INTO user_table(uid, name, phone, email, handle, bio,is_public,pImage,gId) VALUES ('${uid}' ,'${name}', ${phone}, '${email}', '${handle}', '${bio}', ${isPub},'${pImage}','${gId}')`
        console.log(sql);
        connection.query(sql, function (error, results) {
            if (error){
                 reject(error);
            }
            else{
                resolve(results);
            }
          });
    })
}
const addUser= async (req,res)=>{
    try{
        let user=req.body;
        let pImage=req.file.filename;
        let uid=uuidv4();
        user.uid=uid;
        user.pImage=pImage;
        //console.log(user, pImage);
        let result = await insertIntoDb(user);
        res.json({
            "message" : "successfully added a user",
            "data" : result
        })
    }
    catch(err){
        // res.json({
        //     "message" : "Error occured",
        //     "error" : err
        // })
    };
}
app.post("/user", upload.single('photo') ,addUser);

//get ALL users
const getAllFromDb=()=>{
    return new Promise((resolve,reject)=>{
        let sql=`SELECT * FROM user_table`
        connection.query(sql, function(error, data){
            if(error){
                reject(error);
            }
            else{
                resolve(data);
            }
        })
    })
}
const getAllUsers= async (req,res)=>{
    try{
        let result=await getAllFromDb();
        res.json({
            "message" : "Successfully got all the users",
            "data" : result
        })
    }
    catch(error){
        res.json({
            "message" : "operation failed",
            "error" : error
        })
    }
}
app.get("/user",getAllUsers);

//get a user with UID
const getAuserFromDb=(uid)=>{
    return new Promise((resolve,reject)=>{
        let sql=` SELECT * FROM user_table WHERE uid='${uid}'`
        connection.query(sql, function(error,data){
            if(error){
                reject(error);
            }
            else{
                resolve(data);
            }
        })
    })
}
const getUserbyUID= async (req,res)=> {
    try{
        let {uid} =req.params;
        let data= await getAuserFromDb(uid);
        res.json({
            "message" : "User Found",
            "User" : data
        })
    }
    catch(error){
        res.json({
            "message" : "Not Successfull",
            "error" : error
        })
    }
}
app.get("/user/:uid", getUserbyUID);


//update a user

const updateInDb=(uid, updateObject)=>{
    return new Promise((resolve, reject) => {
    
        // UPDATE user_table
        // SET
        // name = "" , handle = "" , is_public = ""
        // WHERE uid = "";
        let sql = `UPDATE user_table SET`;
        for (key in updateObject) {
          if(updateObject[key] != "undefined"){
            sql += ` ${key} = "${updateObject[key]}" ,`;
          }
        }
        sql = sql.slice(0, -1);
        sql += ` WHERE uid = "${uid}"`;
    
        console.log(sql);
    
        connection.query(sql, function (error, data) {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        });
      });
}
const updateVals= async (req,res)=>{
    try{
        let uid =req.params.uid;
        let updateObject=req.body;
        let pImage;
        if(req.file){
            pImage=req.file.filename;
            updateObject.pImage=pImage;
        }
        //let pImage=req.file.filename;
        let result= await updateInDb(uid,updateObject);
        res.json(
            {
                "message" : "user updated",
                "result" : result
            }
        )
    }
    catch(error){
        res.json({
            "message" : "some error occurred",
            "error" : error
        })
    }
}
app.patch("/user/:uid", upload.single("photo"),updateVals);


//delete a user
const delAuserFromDb=(uid)=>{
    return new Promise((resolve,reject)=>{
        let sql=` DELETE FROM user_table WHERE uid='${uid}'`
        connection.query(sql, function(error,data){
            if(error){
                reject(error);
            }
            else{
                resolve(data);
            }
        })
    })
}
const deleteAuser= async (req,res)=>{
    try{
        let {uid} =req.params;
        let data= await delAuserFromDb(uid);
        res.json({
            "message" : "User Found",
            "User" : "User Deleted"
        })
    }
    catch(error){
        res.json({
            "message" : "Not Successfull",
            "error" : error
        })
    }
}
app.delete("/user/:uid", deleteAuser);


// REQUESTS START FROM HERE


// SEND REQUESTS
const addToFollowingTable= (obj)=>{
    return new Promise( (resolve,reject)=>{
        let sql;
        console.log("inside add to following");
        if(obj.ispublic){
            sql=`INSERT INTO user_following (uid, follow_id, isaccepted) VALUES ("${obj.uid}" ,"${obj.follow_id}", 1);`;
        }else{
            sql=`INSERT INTO user_following (uid, follow_id) VALUES ("${obj.uid}" ,"${obj.follow_id}");`;
        }
        connection.query(sql,function(error,data){
            if(error){
                reject(error);
            }else{
                resolve(data);
            }
        })
    })
}
const addToFollowerTable= (follow_id, uid)=>{
    return new Promise((resolve,reject)=>{
        let sql;
        console.log("inside add to follower");
        sql=`INSERT INTO user_follower ( uid, follower_id) VALUES ("${follow_id}" , "${uid}");`;
        connection.query(sql,function(error,data){
            if(error){
                reject(error);
            }
            else{
                resolve(data);
            }
        })
    })
}
const sendRequest= async (req,res)=>{
    try{
        let { uid, follow_id} = req.body;
        let user= await getAuserFromDb(follow_id);
        //console.log(user);
        let isPublic=user[0].is_public;
        if(isPublic){
            let followingResult= await addToFollowingTable(
                {uid : uid,
                 follow_id : follow_id,
                ispublic : isPublic}
                );
            let followerResult= await addToFollowerTable(follow_id,uid);
            res.json({
                message : "Sent Request Successfully",
                result : {followingResult, followerResult}
            })
        }else{
            let followingResult=await addToFollowingTable(
                {uid : uid,
                    follow_id : follow_id,
                   ispublic : isPublic}
            );
            //let followerResult= await addToFollowerTable(follow_id,uid);
            res.json({
                message : " Send Request Pending",
                result : followingResult
            })
        }
    }
    catch(error)
    {   
        res.json({
            message : "Send Request Failed",
            error : error
        })
    }

}
app.post("/user/request", sendRequest);

// ACCEPT REQUESTS
const acceptFollowRequest=(uid,tobeaccepted)=>{
    return new Promise((resolve,reject)=>{
        let sql=`UPDATE user_following SET isaccepted= 1 WHERE follow_id= "${uid}" AND uid= "${tobeaccepted}";`;
        connection.query(sql, function(error,data){
            if(error){
                reject(error);
            }
            else{
                resolve(data);            }
        })
    })
}
const acceptRequests=async (req,res)=>{
    try{
        let { uid , tobeaccepted } = req.body;
        let addedToFollowers = await addToFollowerTable(uid, tobeaccepted);
        let changesInFollowingTable= await acceptFollowRequest(uid, tobeaccepted);
        res.json({
            message : "Request Accepted!!",
            result : {addedToFollowers, changesInFollowingTable}
        })
    }
    catch(error){
        res.json({
            message: "Accept Request Failed",
            error : error
        })
    }
}
app.post("/user/request/accept", acceptRequests);


//SEE PENDING REQUESTS
const getPendingRequests=(uid)=>{
    return new Promise((resolve,reject)=>{
        let sql=`SELECT * FROM user_following WHERE follow_id="${uid}" AND isaccepted= 0 ; `;
        connection.query(sql, function(error,data){
            if(error){
                reject(error);
            }
            else{
                resolve(data);
            }
        })
    })
}
const pendingRequests= async (req,res)=>{
    try{
        let uid=req.params.uid;
        let pendingUsers=await getPendingRequests(uid);
        let users=[];
        for(let i=0;i<pendingUsers.length;i++){
            let oneUser=await getAuserFromDb(pendingUsers[i].uid);
            users.push(oneUser[0]);
        }
        res.json({
            message : "Pending Requests Found",
            users : users
        })
    }
    catch(error){
        res.json({
            message : "Cant see pending requests",
            error : error
        })
    }
}
app.get("/user/request/:uid", pendingRequests);

//GET FOLLOWING
const getAllUsersFollowedbyUid= (uid)=>{
    return new Promise((resolve,reject)=>{
        let sql= `SELECT follow_id FROM user_following WHERE uid="${uid}" AND isaccepted=1 ;`;
        connection.query(sql, function(error,data){
            if(error){
                reject(error);
            }
            else{
                resolve(data);
            }
        })
    })
}
const getAllFollowing= async (req,res)=>{
    try{
        let uid=req.params.uid;
        let users= await getAllUsersFollowedbyUid(uid);
        //console.log(users);
        let result=[];
        for(let i=0;i<users.length;i++){
            let oneUser= await getAuserFromDb(users[i].follow_id);
            result.push(oneUser[0]);
        }
        res.json({
            message : "Following List of the User",
            following : result
        })
    }
    catch(error){
        res.json({
            message : "Cant get all the people user follows.",
            error : error
        })
    }
}
app.get("/user/following/:uid" , getAllFollowing);

//GET COUNT OF FOLLOWING
const getCountFollowing = async (req,res)=>{
    try{
        let uid=req.params.uid;
        let users= await getAllUsersFollowedbyUid(uid);
        //console.log(users);
        let count=users.length;
        res.json({
            message : "Number of People Followed By the User",
            following : count
        })
    }
    catch(error){
        res.json({
            message : "Cant get all the people user follows.",
            error : error
        })
    }
}
app.get("/user/following/count/:uid", getCountFollowing);

//GET FOLLOWERS
const getAllFollowersOfUid=(uid)=>{
    return new Promise((resolve,reject)=>{
        let sql= `SELECT follower_id FROM user_follower WHERE uid="${uid}";`;
        connection.query(sql, function(error,data){
            if(error){
                reject(error);
            }
            else{
                resolve(data);
            }
        })
    })
}
const getAllFollowers= async (req,res)=>{
    try{
        let uid=req.params.uid;
        let users= await getAllFollowersOfUid(uid);
        //console.log(users);
        let result=[];
        for(let i=0;i<users.length;i++){
            let oneUser= await getAuserFromDb(users[i].follower_id);
            result.push(oneUser[0]);
        }
        res.json({
            message : "Follower List of the User",
            following : result
        })
    }
    catch(error){
        res.json({
            message : "Cant get all the people who follow user.",
            error : error
        })
    }
}
app.get("/user/follower/:uid", getAllFollowers);

//GET COUNT OF FOLLOWERS
const getCountFollowers= async (req,res)=>{
    try{
        let uid=req.params.uid;
        let users= await getAllFollowersOfUid(uid);
        //console.log(users);
        let count=users.length;
        res.json({
            message : "Number of Followers of the User",
            following : count
        })
    }
    catch(error){
        res.json({
            message : "Cant get all the people who follows user.",
            error : error
        })
    }
}
app.get("/user/follower/count/:uid", getCountFollowers);


//POSTS


//CREATE A NEW POST

const addAPost=(postObject)=>{
    return new Promise((resolve,reject)=>{
        let { pid , uid, postImage , caption} = postObject;
        const date = new Date();
        let createdAt = date.toISOString().slice(0,19).replace('T',' ');
        postObject.createdAt = createdAt;
        let sql=`INSERT INTO posts(pid, uid, postImage, caption, createdAt) VALUES('${pid}' , '${uid}', '${postImage}', '${caption}' , '${createdAt}')`;
        connection.query(sql, function(error,data){
            if(error){
                reject(error);
            }
            else{
                resolve(data);
            }
        })
    })
}
const createAPost=async(req,res)=>{
    try{
        let pid=uuidv4();
        let postObject=req.body;
        postObject.pid=pid;
        let postImage= "/posts/" + req.file.filename;
        postObject.postImage=postImage;
        let postData= await addAPost(postObject);
        res.json({
            message: "Post created",
            data : postData
        })
    }
    catch(error){
        res.json({
            message : "Error occured",
            error : error
        })
    }
}
app.post("/post",upload.single('postImage') ,createAPost);

//GET ALL POSTS

const getAllPostsFromDb=()=>{
    return new Promise((resolve,reject)=>{
        let sql=`SELECT * FROM posts ORDER BY createdAt DESC`;
        connection.query(sql, function(error,data){
            if(error){
                reject(error);
            }else{
                resolve(data);
            }
        })
    })
}
const getAllPosts=async(req,res)=>{
    try{
        let postData= await getAllPostsFromDb();
        res.json({
            message : "Got all Posts",
            data : postData
        })
    }
    catch(error){
        res.json({
            message : "Task Failed",
            error : error
        })
    }
}
app.get("/posts", getAllPosts);


//GET POST BY UID
const getAllPostsOfUid=(uid)=>{
    return new Promise((resolve,reject)=>{
        let sql=`SELECT * FROM posts WHERE uid = "${uid}" ORDER BY createdAt DESC`;
        connection.query(sql, function(error,data){
            if(error){
                reject(error);
            }
            else{
                resolve(data);
            }
        })
    })
}
const getPostById=async(req,res)=>{
    try{
        let {uid}=req.params;
        let postData=await getAllPostsOfUid(uid);
        res.json({
            message : "Got All Posts of UID",
            data: postData
        })
    }
    catch(error){
        res.json({
            message : "Task Failed",
            error : error
        })
    }
}
app.get("/posts/:uid", getPostById);

//UPDATE A POST

const updatePostInDb=(pid,caption)=>{
    return new Promise((resolve,reject)=>{
        let sql=`UPDATE posts SET caption = "${caption}" WHERE pid = "${pid}"`;
        connection.query(sql, function(error,data){
            if(error){
                console.log("error");
                reject(error);
            }
            else{
                resolve(data);
            }
        })
    })
}
const updatePost=async(req,res)=>{
    try{
        let {pid,caption}=req.body;
        let updatePost=await updatePostInDb(pid,caption);
        res.json({
            message: "Updated Post",
            data: updatePost
        })
    }
    catch(error){
        res.json({
            message : "Task Failed",
            error : error
        })
    }
}
app.patch("/post", updatePost);

//Get Posts of All following
const getFeedFromDb=(users)=>{
    return new Promise((resolve,reject)=>{
        // let sql = `UPDATE user_table SET`;
        // for (key in updateObject) {
        //   if(updateObject[key] != "undefined"){
        //     sql += ` ${key} = "${updateObject[key]}" ,`;
        //   }
        // }
        // `SELECT * FROM posts WHERE uid = "${uid}" ORDER BY createdAt DESC
        let sql=`SELECT * FROM posts WHERE uid IN(`;
        for(let i=0;i<users.length;i++){
           // console.log(users[i]);
            sql+=`"${users[i].follow_id}",`;
        }
        sql = sql.slice(0, -1);
        sql+=`) ORDER BY createdAt DESC`;
        connection.query(sql,function(error,data){
            if(error){
                reject(error);
            }
            else{
                resolve(data);
            }
        })
    })
}
const getFeed=async (req,res)=>{
    try{
        let {uid}=req.params;
        let followingData=await getAllUsersFollowedbyUid(uid);
        followingData.push({follow_id : uid});
        // let followingObject=followingData.following;
        let feedData=await getFeedFromDb(followingData);
        res.json({
            message : "Got Feed",
            data: feedData
        })
    }
    catch(error){
        res.json({
            message : "Task Failed",
            error : error
        })
    }
}

app.get("/feed/posts/:uid",getFeed);

app.get("/",(req,res)=>{
    res.send("Hello Backend Started")
});
//AUTHENTICATION BEGINS
let port = process.env.PORT || 3000;
app.listen(port,function(){
    console.log(`App running at ${port}`);
})
app.use(cookieSession({
    maxAge: 24*60*60*1000,
    keys:["asdfcvbuiojklqwer"]
}))

function getUserById(gid){
    return new Promise((resolve , reject)=>{
        let sql = `SELECT * FROM user_google WHERE gid = '${gid}'`;
        connection.query(sql , function(error , data){
            if(error){
                reject(error);
            }
            else{
                resolve(data);
            }
        })
    })
}
function createUser(userObject){
    return new Promise((resolve , reject)=>{
        let {gId , name , email , pImage} = userObject;
        let sql = `INSERT INTO user_google(gid , name , email , pImage) VALUES ( '${gId}' , '${name}' , '${email}' , '${pImage}'  ) `;
        connection.query(sql , function(error , data){
            if(error){
                reject(error);
            }
            else{
                resolve(data);
            }
        })
    })
}

// when cookie is not present and reach this point when all the authencation has happened 
passport.serializeUser( (user , done)=>{
    // console.log("inside serialize user !!");
    // console.log(user);
    done(null , user.gId); //=> cookie generated as saved as id
});

// cookie already present then deserialize user will give you a id
passport.deserializeUser( (id , done)=>{
    // console.log("inside deserialize user !!");
    getUserById(id).then((userData)=>{
        // console.log(userData);
        done(null , userData[0]);
    })
})

app.use(passport.initialize());
app.use(passport.session());

let isUserNew;
passport.use(new GoogleStrategy({
    clientID:"849540318287-cj4sgedcqqnp7th7dbs8p5vhr00bbapg.apps.googleusercontent.com",
    clientSecret:"4NsuBWx4xgmzUpS4832yAD5n",
    callbackURL:"/auth/callback"
},async (accessToken, refreshToken, profile,done)=>{
    console.log("inside passport.use callback function");
    // console.log(profile);
    let gId = profile.id;
    let name = profile.displayName;
    let email = profile.emails[0].value;
    let pImage = profile.photos[0].value;
    let userObject = {gId , name , email , pImage };
    // find if user exists in databases ??
    let userData = await getUserById(gId);
    if(userData.length){
        // console.log("User already signed up");
        isUserNew=false;
        done(null , userObject);
    }
    else{
        let createUserData=await createUser(userObject);
        // console.log("new user created");
        isUserNew=true;
        done(null , userObject);
    }
}));

app.use(bodyParser.urlencoded({extended: true}));
function authChecker(req, res , next){
    if(req.user){
        next();
    }
    else{
        res.redirect("/");
    }
}
app.get("/" , (req, res) => {
//   res.render("login", {user : req.user});
});
app.get("/home", authChecker , (req, res) => {
//   res.render("home" , {user : req.user});
});
app.get("/profile", authChecker , (req, res) => {
//   res.render("profile" , {user : req.user}  );
});
app.get("/auth/google", passport.authenticate("google",{scope:["profile", "email"]}));

app.get("/auth/checkAuth", (req,res)=>{
    let user=req.user;
    if(user){
        res.json({
            isAuth : true,
            user: isUserNew
        })
    }
    else{
        res.json({
            isAuth: false,
            user: isUserNew
        })
    }
})

getUidFromgId=(gid)=>{
    return new Promise((resolve,reject)=>{
        let sql=`SELECT uid FROM user_table WHERE gId="${gid}"`;
        console.log(sql);
        connection.query(sql,function(error,data){
            if(error){
                reject(error);
            }
            else{
                resolve(data);
            }
        })
    })
}
getUid=async(req,res)=>{
    try{
        let {gId}=req.params;
        let uIdData= await getUidFromgId(gId);
        res.json({
            message : "Got UID",
            data : uIdData
        })
    }catch(error){
        res.json({
            message : "Failed",
            error: error
        })
    }
}
app.get("/user/uid/:gId", getUid);
let currUser;
app.get("/auth/callback",passport.authenticate("google"),(req,res)=>{
    // console.log(req.user);
    currUser=req.user;
    res.redirect("http://localhost:3001/");
})
app.get("/auth/user" , (req,res)=>{
    // console.log(user);
    if(currUser){
    res.json({
        user : currUser
    })
    }
    else{
        res.json({
            message: "no User",
            user : {}
        })
    }
})
app.get("/auth/logout", (req,res)=>{
    //res.send("logging out");
    req.logOut();
    // res.redirect("/home");
    res.end();
})




