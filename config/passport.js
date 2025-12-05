var passport = require('passport');
var User = require('../models/user');
var LocalStrategy = require('passport-local').Strategy;

/* ================================
   SERIALIZE & DESERIALIZE
================================ */

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

/* ================================
   PASSWORD VALIDATION
================================ */

function validatePassword(password) {
    let errors = [];
    if (password.length < 6) {
        errors.push("Your password must be at least 6 characters.");
    }
    if (password.length > 15) {
        errors.push("Your password must be at most 15 characters.");
    }
    if (!/[A-Z]/.test(password)) {
        errors.push("Your password must contain at least one uppercase letter.");
    }
    if (!/[a-z]/.test(password)) {
        errors.push("Your password must contain at least one lowercase letter.");
    }
    if (!/[0-9]/.test(password)) {
        errors.push("Your password must contain at least one digit.");
    }
    if (!/[!@#$%^&*]/.test(password)) {
        errors.push("Your password must contain at least one special character.");
    }
    return errors;
}

/* ================================
   REGISTER STRATEGY
================================ */

passport.use('local-register', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
},
    async function (req, email, password, done) {

        try {
            var { name, class: classs, rollnumber, teacher, student, year } = req.body;
            let messages = [];

            req.checkBody('email', 'Invalid email').notEmpty().isEmail();
            req.checkBody('password', 'Invalid password').notEmpty();

            var errors = req.validationErrors();
            if (errors) {
                errors.forEach(err => messages.push(err.msg));
                return done(null, false, req.flash('error', messages));
            }

            let passErrors = validatePassword(password);
            if (passErrors.length > 0) {
                return done(null, false, req.flash('error', passErrors));
            }

            if (!teacher && !student) {
                return done(null, false, req.flash('error', ["Please select Teacher or Student"]));
            }

            if (student && year == "Year") {
                return done(null, false, req.flash('error', ["Please select a year"]));
            }

            if (classs == "Class") {
                return done(null, false, req.flash('error', ["Please select a class"]));
            }

            // ✅ CHECK ROLL NUMBER FOR STUDENTS
            if (rollnumber) {
                let rollUser = await User.findOne({ rollnumber });
                if (rollUser) {
                    return done(null, false, { message: 'Roll number already in use.' });
                }
            }

            // ✅ CHECK DUPLICATE EMAIL
            let emailUser = await User.findOne({ email });
            if (emailUser) {
                return done(null, false, { message: 'Email already in use.' });
            }

            // ✅ CREATE USER
            let newUser = new User();
            newUser.name = name;
            newUser.email = email;
            newUser.password = newUser.encryptPassword(password);
            newUser.class = classs;
            newUser.rollnumber = rollnumber;

            if (teacher == "0") {
                newUser.who = teacher;
            } else if (student) {
                newUser.who = student;
                newUser.year = year;
            } else {
                newUser.who = "";
            }

            await newUser.save();
            return done(null, newUser);

        } catch (err) {
            return done(err);
        }

    }));

/* ================================
   LOGIN STRATEGY
================================ */

passport.use('local-login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
},
    function (req, email, password, done) {

        req.checkBody('email', 'Invalid Email').notEmpty().isEmail();
        req.checkBody('password', 'Invalid password').notEmpty();

        var errors = req.validationErrors();
        if (errors) {
            let messages = [];
            errors.forEach(err => messages.push(err.msg));
            return done(null, false, req.flash('error', messages));
        }

        // ✅ FIND USER
        User.findOne({ email }, function (err, user) {
            if (err) return done(err);

            if (!user) {
                return done(null, false, { message: 'User not found.' });
            }

            if (!user.validPassword(password)) {
                return done(null, false, { message: 'Invalid Password' });
            }

            return done(null, user);
        });

    }));
