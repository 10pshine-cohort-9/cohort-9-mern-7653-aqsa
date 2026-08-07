import {body} from "express-validator";
export const registerValidations=[
    body("username").trim()
    .notEmpty().withMessage("Username is required")
      .isLength({min:3,max:20}).withMessage("Username must be between 3 and 20 characters"),

    body("email").trim().isEmail()
    .withMessage("Enter a valid email")
    .normalizeEmail(),

    body("password").isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
]
export const loginValidations=[ 
    body("email").trim().isEmail().withMessage("Enter valid email")
    .normalizeEmail(),
    body("password").notEmpty()
    .withMessage("Password is required")
];