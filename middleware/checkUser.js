module.exports = (req,res,next) => {
 if(req.session.isLoggedIn == true){
    next();
 } else{
    req.flash('message' , "Your Session is expired please login again")
    return res.redirect('/')
 }
}