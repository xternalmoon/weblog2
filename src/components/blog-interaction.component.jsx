import { useContext, useEffect } from "react";
import { BlogContext } from "../pages/blog.page";
import { Link } from "react-router-dom";
import { ThemeContext, UserContext } from "../App";
import { Toaster, toast } from "react-hot-toast";
import axios from "axios";
import { apiUrl } from "../common/api";
import x from "../imgs/twitter.png";
import xDark from "../imgs/twitter-dark.png";

const BlogInteraction = () => {
  let {
    blog,
    blog: {
      _id,
      title,
      blog_id,
      activity,
      activity: { total_likes, total_comments },
      author: {
        personal_info: { username: author_username },
      },
    },
    setBlog,
    islikedByUser,
    setLikedByUser,
    setCommentsWrapper,
  } = useContext(BlogContext);

  let {
    userAuth: { username, access_token },
  } = useContext(UserContext);

  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    if (access_token) {
      axios
        .post(
          apiUrl("/isliked-by-user"),
          { _id },
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          }
        )
        .then(({ data: { result } }) => {
          setLikedByUser(Boolean(result));
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, [access_token, _id, setLikedByUser]);

  const handleLike = () => {
    if (access_token) {
      setLikedByUser((preVal) => !preVal);
      !islikedByUser ? total_likes++ : total_likes--;
      setBlog({ ...blog, activity: { ...activity, total_likes } });

      axios
        .post(
          apiUrl("/like-blog"),
          { _id, islikedByUser },
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          }
        )
        .then(({ data }) => {
          console.log(data);
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      toast.error("Please login to like");
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: title,
      text: `Hey, check out this blog.`,
      url: location.href,
    };
  
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Share failed:", err);
      }
    } else {
      navigator.clipboard.writeText(`Hey, check out this blog on We'blog: ${location.href}`);
      toast.success("Link copied to clipboard!");
    }
  };
  

  return (
    <>
      <Toaster />
      <hr className="border-grey my-2" />

      <div className="flex gap-6 justify-between">
        <div className="flex gap-3 items-center">
          <button
            onClick={handleLike}
            className={
              "w-10 h-10 rounded-full flex items-center justify-center " +
              (islikedByUser ? "bg-red/20 text-red" : "bg-grey/80")
            }
          >
            <i
              className={
                "fi " + (islikedByUser ? "fi-sr-heart" : "fi-rr-heart")
              }
            ></i>
          </button>
          <p className="text-xl text-dark-grey">{total_likes}</p>

          <button
            onClick={() => setCommentsWrapper((preVal) => !preVal)}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-grey/80"
          >
            <i className="fi fi-rr-comment-dots"></i>
          </button>
          <p className="text-xl text-dark-grey">{total_comments}</p>
        </div>

        <div className="flex gap-6 items-center">
          {username === author_username && (
            <Link
              to={`/editor/${blog_id}`}
              className="underline hover:text-logoGreen"
            >
              Edit
            </Link>
          )}

          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-grey/80"
          >
            <i className="fi fi-rr-share"></i>
          </button>

          <Link
            to={`https://twitter.com/intent/tweet?text=Read ${title}&url=${location.href}`}
          >
            <img
              src={theme === "light" ? x : xDark}
              alt="Twitter"
              className="w-5 h-5"
            />
          </Link>
        </div>
      </div>

      <hr className="border-grey my-2" />
    </>
  );
};

export default BlogInteraction;
