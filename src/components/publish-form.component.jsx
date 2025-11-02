import { Toaster, toast } from "react-hot-toast";
import AnimationWrapper from "../common/page-animation";
import { useContext, useState } from "react";
import { EditorContext } from "../pages/editor.pages";
import Tag from "./tags.component";
import axios from "axios";
import { UserContext } from "../App";
import { useNavigate, useParams } from "react-router-dom";
import ConfettiEffect from "../common/confetti";

const PublishForm = () => {
    const [showConfetti, setShowConfetti] = useState(false); // State to manage confetti visibility

    let characterLimit = 350;
    let tagLimit = 10;

    let { blog_id } = useParams();
    let { blog, blog: { banner, title, tags, des, content }, setEditorState, setBlog } = useContext(EditorContext);
    let { userAuth: { access_token } } = useContext(UserContext);
    let navigate = useNavigate();

    const handleCloseEvent = () => {
        setEditorState("editor");
    }

    const handleBlogTitleChange = (e) => {
        let input = e.target;
        setBlog({ ...blog, title: input.value });
    }

    const handleBlogDesChange = (e) => {
        let input = e.target;
        setBlog({ ...blog, des: input.value });
    }

    const handleTitleKeyDown = (e) => {
        if (e.keyCode === 13) { // Enter key
            e.preventDefault();
        }
    }

    const handleKeyDown = (e) => {
        if (e.keyCode === 13 || e.keyCode === 188) {
            e.preventDefault();
            let tag = e.target.value.trim();

            if (tag.length > 0) {
                if (tags.length < tagLimit) {
                    if (!tags.includes(tag)) {
                        setBlog({ ...blog, tags: [...tags, tag] });
                    } else {
                        toast.error("Tag already exists");
                    }
                } else {
                    toast.error(`You can add max ${tagLimit} Tags`);
                }
            }
            e.target.value = "";
        }
    }

    const handleGenerateTitle = () => {
        if (des && des.length > 0) {
            // Show loading toast
            const loadingToastId = toast.loading("Title on the way..");
    
            axios.post(import.meta.env.VITE_AI_MODELS_URL + "/title", { text: des }, {
            })
            .then(response => {
                setBlog({ ...blog, title: response.data.title });
                toast.success("Title generated successfully", { id: loadingToastId });
            })
            .catch(error => {
                if (error.response?.status === 429) {
                    toast.error("Limit reached. Try again in a minute.", { id: loadingToastId });
                } else {
                    const errorMessage = error.response?.data?.message || "Failed to generate title. Please try again later.";
                    toast.error(errorMessage, { id: loadingToastId });
                }
                console.error("Error generating title:", error);
            });
        } else {
            toast.error("Add an excerpt before generating the title");
        }
    };
    

    const publishBlog = (e) => {
        if (e.target.className.includes("disable")) {
            return;
        }

        if (!title.length) {
            return toast.error("Write blog title before publishing");
        }

        if (!des.length || des.length > characterLimit) {
            return toast.error(`Write a description about your blog within ${characterLimit} characters to publish`);
        }

        if (!tags.length) {
            return toast.error("Enter at least 1 tag to help us rank your blog");
        }

        let loadingToast = toast.loading("Publishing....");
        e.target.classList.add('disable');

        let blogObj = {
            title, banner, des, content, tags, draft: false
        };

        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/create-blog", { ...blogObj, id: blog_id }, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        })
        .then(() => {
            e.target.classList.remove('disable');
            toast.dismiss(loadingToast);
            toast.success("Published");

            // Show confetti and navigate after a delay
            setShowConfetti(true);
            setTimeout(() => {
                setShowConfetti(false);
                navigate("/dashboard/blogs");
            }, 3000);

        })
        .catch(({ response }) => {
            e.target.classList.remove('disable');
            toast.dismiss(loadingToast);
            return toast.error(response.data.error);
        });
    }

    return (
        <AnimationWrapper>
            <section className="w-screen min-h-screen grid items-center lg:grid-cols-2 py-16 lg:gap-4">
            {showConfetti && <ConfettiEffect />}
                <Toaster />

                {/* Render confetti conditionally */}

                <button className="w-12 h-12 absolute right-[5vw] z-10 top-[5%] lg:top-[10%]"
                    onClick={handleCloseEvent}
                >
                    <i className="fi fi-br-cross"></i>
                </button>

                <div className="max-w-[550px] center">
                    <p className="text-dark-grey mb-1">Preview</p>
                    <div className="w-full aspect-video rounded-lg overflow-hidden bg-grey mt-4">
                        <img src={banner} alt="Blog Banner" />
                    </div>

                    <h1 className="text-2xl md:text-4xl font-medium mt-3 leading-tight line-clamp-2">{title}</h1>
                    <p className="font-gelasio line-clamp-2 md:text-xl leading-7 mt-4">{des}</p>
                </div>

                <div className="border-grey lg:border-1 lg:pl-8">
                    <p className="text-dark-grey mb-2 mt-9">Blog Title</p>
                    <div className="flex flex-col md:flex-row relative">
                    <input type="text" placeholder="" value={title} className="input-box pl-4 rounded-l-lg" onChange={handleBlogTitleChange} />
                        <button 
                        className="absolute top-0 right-0 w-[30%] h-14 rounded-tr-lg rounded-br-lg md:p-4 p-2 bg-gradient-to-br text-fuchsia-50 from-[#fe9a48] to-[#df4afd] via-[#9754f6] md:text-base font-bold"
                        onClick={handleGenerateTitle}
                        >
                            Generate&nbsp;
                            <i className="fi fi-rr-sparkles"> </i>
                        </button>
                    </div>

                    <p className="text-dark-grey mb-2 mt-9">Add a short, engaging excerpt to posts!</p>
                    <textarea
                        maxLength={characterLimit}
                        value={des}
                        className="h-56 resize-none leading-7 input-box pl-4"
                        onChange={handleBlogDesChange}
                        onKeyDown={handleTitleKeyDown}
                    >
                    </textarea>
                    <p className="mt-1 text-dark-grey text-sm text-right">{characterLimit - des.length} characters left</p>

                    <p className="text-dark-grey mb-2 mt-9">Topics - Enhance searchability and ranking of your blog post</p>
                    <p className="text-dark-grey text-sm mb-2">Type a tag and press Enter or comma (,) to add it</p>
                    <div className="relative input-box pl-2 py-2 pb-4 min-h-[60px]">
                        <input 
                            type="text" 
                            placeholder="Type tag and press Enter..." 
                            className="sticky input-box bg-white top-0 left-0 pl-4 mb-3 focus:bg-white w-full"
                            onKeyDown={handleKeyDown}
                        />
                        <div className="flex flex-wrap gap-2 mt-2">
                            {
                                tags.map((tag, i) => {
                                    return <Tag tag={tag} tagIndex={i} key={i} />;
                                })
                            }
                        </div>
                    </div>
                    <p className="mt-1 mb-4 text-dark-grey text-right">{tagLimit - tags.length} Tags left</p>

                    <button className="btn-dark px-8" onClick={publishBlog}>Publish</button>
                </div>
            </section>
        </AnimationWrapper>
    );
}

export default PublishForm;
