import { useContext } from "react";
import AnimateWrap from "../common/page-animation";
import cover1 from "../imgs/cover.svg"; // Cover image for sign-in
import cover2 from "../imgs/cover2.svg"; // Cover image for sign-up
import cover1Dark from "../imgs/cover-dark.svg"; // Cover image for sign-in
import cover2Dark from "../imgs/cover2-dark.svg"; // Cover image for sign-up
import InputBox from "../components/input.component";
import google from "../imgs/google.png";
import { Link, Navigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import axios from "axios";
import { storeInSession } from "../common/session";
import { ThemeContext, UserContext } from "../App";


const UserAuthForm = ({ type }) => {

    let { userAuth: { access_token }, setUserAuth } = useContext(UserContext)

    const userAuthThroughServer = (serverRoute, formData) => {
        const serverDomain = import.meta.env.VITE_SERVER_DOMAIN;
        
        if (!serverDomain) {
            toast.error("Server configuration error. Please check environment variables.");
            console.error("VITE_SERVER_DOMAIN is not set");
            return;
        }

        const fullUrl = serverDomain + serverRoute;
        console.log("📤 Sending request to:", fullUrl);
        console.log("📦 Form data:", formData);

        axios.post(fullUrl, formData)
        .then(({ data }) => {
            storeInSession("user", JSON.stringify(data))
            setUserAuth(data)
            toast.success(type === "sign-in" ? "Welcome back!" : "Account created successfully!")
        })
        .catch((error) => {
            console.error("❌ Auth error:", error);
            console.error("❌ Error response:", error.response);
            console.error("❌ Request URL:", error.config?.url);
            
            if (error.response?.status === 404) {
                toast.error(`Route not found. Check backend URL: ${serverDomain}`);
            } else if (error.response?.data?.error) {
                toast.error(error.response.data.error);
            } else if (error.message) {
                toast.error(error.message);
            } else {
                toast.error("Something went wrong. Please try again.");
            }
        })

    }

    let { theme } = useContext(ThemeContext)

    const handleSubmit = (e) => {

        e.preventDefault();

        let serverRoute = type == "sign-in" ? "/signin" : "/signup";

        let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
        let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

        // formData - FIX: e.currentTarget is the form when onSubmit fires
        // e.target would be the form itself, not a button, so e.target.form is undefined
        const formElement = e.currentTarget || document.getElementById('formElement');
        if (!formElement) {
            toast.error("Form error. Please refresh the page.");
            return;
        }
        
        let form = new FormData(formElement);
        let formData = {};

        for(let [key, value] of form.entries()){
            formData[key] = value;
        }

        let { fullname, email, password, username } = formData;

        // form validation
        if(type !== "sign-in") {
            // Signup validation
            if(!fullname || fullname.length < 3){
                return toast.error("Fullname must be at least 3 letters long")
            }
            if(!username || username.length < 3){
                return toast.error("Username must be at least 3 characters long")
            }
            // Validate username format (alphanumeric only)
            let usernameRegex = /^[a-zA-Z0-9]+$/;
            if(!usernameRegex.test(username)){
                return toast.error("Username can only contain letters and numbers")
            }
        }
        
        if(!email || !email.length){
            return toast.error("Enter Email" )
        }
        if(!emailRegex.test(email)){
            return toast.error("Email is invalid" )
        }
        if(!password || !passwordRegex.test(password)){
            return toast.error("Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase letters")
        }

       userAuthThroughServer(serverRoute, formData)

    }

    const coverImage = type === "sign-in"
    ? (theme === "light" ? cover1 : cover1Dark)
    : (theme === "light" ? cover2 : cover2Dark);

    return (
        access_token ? (
            <Navigate to="/latest" />
        ) : (
            <AnimateWrap keyValue={type}>
                <section className="h-cover flex flex-col md:flex-row items-center justify-between">
                    <div className="md:w-auto w-2/3">
                        <img src={coverImage} alt="" className="" />
                    </div>
                    <Toaster />
                    <form id="formElement" className="w-2/3 max-w-[400px]" onSubmit={handleSubmit}>
                        <h1 className="md:text-3xl text-2xl font-semibold capitalize text-center mb-4 md:mb-24">
                            {type === "sign-in" ? "welcome, we missed you" : "Connect with us"}
                        </h1>
                        {
                            type !== "sign-in" ? (
                                <>
                                    <InputBox
                                        name="fullname"
                                        type="text"
                                        placeholder="Full Name"
                                        icon="fi-rr-user"
                                    />
                                    <InputBox
                                        name="username"
                                        type="text"
                                        placeholder="Username"
                                        icon="fi-rr-at"
                                    />
                                </>
                            ) : ""
                        }
                        <InputBox
                            name="email"
                            type="email"
                            placeholder="Email Address"
                            icon="fi-rr-envelope"
                        />
                        <InputBox
                            name="password"
                            type="password"
                            placeholder="Password"
                            icon="fi-rr-key"
                        />

                        <button className="btn-dark center md:mt-12 mt-6" type="submit">
                            {type.replace("-", " ")}
                        </button>

                        <div className="relative w-full flex items-center gap-2 my-6 opacity-20 uppercase text-black font-bold">
                            <hr className="w-1/2 border-black" />
                            <p>Or</p>
                            <hr className="w-1/2 border-black" />
                        </div>
                        <button className="hidden btn-light md:flex items-center text-base justify-center gap-4 center w-full">
                            <img src={google} alt="" className="w-5" />
                            continue with google
                        </button>

                        {
                            type === "sign-in" ? (
                                <p className="mt-6 text-dark-grey md:text-xl text-base text-center">
                                    Don't have an account? <br className="md:hidden"/>
                                    <Link to="/signup" className="underline text-black font-medium text-base ml-1">
                                        Create a new
                                    </Link>
                                </p>
                            ) : (
                                <p className="mt-6 text-dark-grey md:text-xl text-center">
                                    Already have an account? <br className="md:hidden"/>
                                    <Link to="/signin" className="underline text-black font-medium text-xl ml-1">
                                        Sign in
                                    </Link>
                                </p>
                            )
                        }
                    </form>
                </section>
            </AnimateWrap>
        )
    );
}

export default UserAuthForm;
