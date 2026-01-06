import { Request, Response } from 'express';
import User from '../models/User.js';
import bcrypt from 'bcrypt';
import { error } from 'node:console';



//Controler for User Authentication (Login, Register, Logout)




export const registerUser = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body; 
        // Check if user already exists
        const user = await User.findOne({ email });
        if (user) {
            return  res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
        });

        await newUser.save();

        //seting user data in session
        req.session.isLoggedIn = true;
        req.session.userId = newUser._id.toString();

        return res.json({
             message: 'User registered successfully', 
             user: {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
            } 
        });
    
    
    } catch (error:any) {
        console.error( error);
        res.status(500).json({ message: error.message });
    }
}



//controller for User Login
export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body; 
        
        // Find user by email
        const user = await User.findOne({ email });
        if (!user ) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Compare password
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Set session data
        req.session.isLoggedIn = true;
        req.session.userId = user._id.toString();;

        return res.json({
            message: 'User logged in successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
            }
        });

    }catch (error:any) {
        console.error( error);
        res.status(500).json({ message: error.message });}
    
    }

    //controller for User Logout
export const logoutUser = (req: Request, res: Response) => {
    req.session.destroy((error:any) => {

        if (error) {
            console.log(error);
            return res.status(500).json({ message:error.message });
        }   
    })
   
    return res.json({ message: 'Logout successfully' });
}

//controllers for user verification
export const verifyUser = async (req: Request, res: Response) => {
    try {
       const {userId} = req.session;
       const user = await User.findById(userId).select('-password');
       if (!user) {
        return res.status(404).json({ message: 'User not found' });
       }
        return res.json({ user });

    } catch (error:any) {
        console.error(error);
        return res.status(500).json({ message:error.message });
    }
}