import axios from "axios";
import { apiUrl, aiUrl } from "../common/api";
import { createContext, useEffect, useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import AnimationWrapper from "../common/page-animation";
import Loader from "../components/loader.component";
import { getDay } from "../common/date";
import BlogInteraction from "../components/blog-interaction.component";
import BlogPostCard from "../components/blog-post.component";
import BlogContent from "../components/blog-content.component";
import CommentsContainer, {
  fetchComments,
} from "../components/comments.component";
import toast from "react-hot-toast";
import ProgressBar from "react-scroll-progress-bar";
import ReactMarkdown from "react-markdown";

// New: function to estimate reading time
const calculateReadingTime = (text) => {
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
};

export const blogStructure = {
  title: "",
  des: "",
  conent: [],
  author: { personal_info: {} },
  banner: "",
  publishedAt: "",
};

export const BlogContext = createContext({});

const BlogPage = () => {
  let { blog_id } = useParams();

  const [blog, setBlog] = useState(blogStructure);
  const [similarBlogs, setSimilrBlogs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [islikedByUser, setLikedByUser] = useState(false);
  const [commentsWrapper, setCommentsWrapper] = useState(false);
  const [totalParentCommentsLoaded, setTotalParentCommentsLoaded] = useState(0);
  const [buttonVisible, setButtonVisible] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState("");
  const [summary, setSummary] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const tooltipRef = useRef();

  let {
    title,
    content,
    banner,
    author: {
      personal_info: { fullname, username: author_username, profile_img },
    },
    publishedAt,
  } = blog;

  const fetchBlog = () => {
    axios
      .post(apiUrl("/get-blog"), { blog_id })
      .then(async ({ data: { blog } }) => {
        blog.comments = await fetchComments({
          blog_id: blog._id,
          setParentCommentCountFun: setTotalParentCommentsLoaded,
        });
        setBlog(blog);

        axios
          .post(apiUrl("/search-blogs"), {
            tag: blog.tags[0],
            limit: 6,
            eliminate_blog: blog_id,
          })
          .then(({ data }) => {
            setSimilrBlogs(data.blogs);
          });

        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  };

  const handleTextSelection = () => {
    try {
      const selection = window.getSelection();
      const selected = selection.toString();
      const wordCount = selected.trim().split(/\s+/).length;

      if (wordCount > 0 && showTooltip) {
        setShowTooltip(false);
      }

      if (selected && !selection.isCollapsed && wordCount >= 15) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        setButtonPosition({
          top: rect.top + window.scrollY - 50,
          left: rect.left + window.scrollX + rect.width / 2 - 50,
        });

        setSelectedText(selected);
        setButtonVisible(true);
      } else {
        setButtonVisible(false);
      }
    } catch (err) {
      console.error("Error handling text selection:", err);
    }
  };

  const handleSummarizeClick = async () => {
    try {
      if (selectedText) {
        const loadingToast = toast.loading("Generating summary...", {
          id: "summary-loading",
        });

        const response = await axios.post(aiUrl("/summarize"), {
          text: selectedText,
        });

        setSummary(response.data.summary);
        setShowModal(true);

        toast.dismiss(loadingToast);
      }
    } catch (err) {
      console.error("Error handling summarize click:", err);
      toast.dismiss("summary-loading");

      // Check if the error is due to rate limiting (status code 429 or custom message)
      if (err.response?.status === 429) {
        toast.error(
          "Limit reached. Try again in a minute."
        );
      } else {
        // If it's another error, show the server's message or a fallback
        const errorMessage =
          err.response?.data?.message ||
          "Failed to generate summary. Please try again later.";
        toast.error(errorMessage);
      }
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summary);
    alert("Summary copied to clipboard!");
  };

  const closeModal = () => setShowModal(false);

  useEffect(() => {
    resetStates();
    fetchBlog();
    document.addEventListener("selectionchange", handleTextSelection);

    const preventCtrlA = (e) => {
      if (e.ctrlKey && e.key === "a") {
        e.preventDefault();
      }
    };

    document.addEventListener("keydown", preventCtrlA);

    return () => {
      document.removeEventListener("selectionchange", handleTextSelection);
      document.removeEventListener("keydown", preventCtrlA);
    };
  }, [blog_id]);

  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const resetStates = () => {
    setBlog(blogStructure);
    setSimilrBlogs(null);
    setLoading(true);
    setLikedByUser(false);
    setCommentsWrapper(false);
    setTotalParentCommentsLoaded(0);
  };

  return (
    <AnimationWrapper>
      <ProgressBar height="4" bgcolor="#a8eb12" duration="0.3" />
      {loading ? (
        <Loader />
      ) : (
        <BlogContext.Provider
          value={{
            blog,
            setBlog,
            islikedByUser,
            setLikedByUser,
            commentsWrapper,
            setCommentsWrapper,
            totalParentCommentsLoaded,
            setTotalParentCommentsLoaded,
          }}
        >
          <CommentsContainer />

          <div className="max-w-[900px] center py-10 max-lg:px-[5vw]">
            <img src={banner} className="aspect-video" />

            <div className="mt-12">
              <h2>{title}</h2>

              <div className="flex max-sm:flex-col justify-between my-8">
                <div className="flex gap-5 items-start">
                  <img src={profile_img} className="w-12 h-12 rounded-full" />

                  <p className="capitalize">
                    {fullname}
                    <br />@
                    <Link
                      to={`/user/${author_username}`}
                      className=" lowercase underline"
                    >
                      {author_username}
                    </Link>
                  </p>
                </div>
                <p className="text-black opacity-75 max-sm:mt-6 max-sm:ml-12 max-sm:pl-5">
                  {calculateReadingTime(
                    content[0].blocks.map((block) => block.data.text).join(" ")
                  )}{" "}
                  min read | Published on {getDay(publishedAt)}
                </p>
              </div>
            </div>

            <div className="my-12 font-gelasio blog-page-content">
              {content[0].blocks.map((block, i) => {
                return (
                  <div key={i} className="my-4 md:my-8">
                    <BlogContent block={block} />
                  </div>
                );
              })}
            </div>

            {buttonVisible && (
              <button
                className="absolute bg-gradient-to-br from-[#fe9a48] to-[#df4afd] via-[#9754f6] text-fuchsia-50 px-4 py-2 rounded-full shadow-lg transform -translate-x-1/2 z-50"
                style={{
                  top: buttonPosition.top,
                  left: buttonPosition.left,
                }}
                title="Generate summary for selected content"
                onClick={handleSummarizeClick}
              >
                Summarize &nbsp;
                <i className="fi fi-rs-thought-bubble"> </i>
              </button>
            )}

            {showTooltip && (
              <div
                ref={tooltipRef}
                className="text-base fixed md:top-10 top-20 w-[90%] md:w-auto left-1/2 transform -translate-x-1/2  bg-gradient-to-br from-[#fe9a48] to-[#df4afd] via-[#9754f6] text-fuchsia-50 px-4 py-2 rounded-lg shadow-lg"
                style={{ zIndex: 1000 }}
              >
                Select 15 or more words to spin a summary...
              </div>
            )}

            {showModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-xs sm:max-w-sm md:max-w-2xl lg:max-w-4xl xl:max-w-6xl relative mx-4">
                  <p className="text-2xl font-semibold mb-4">Summarized Result</p>

                  {/* Render the summary as Markdown */}
                  <div className="prose max-w-none text-black mb-4 overflow-auto max-h-[75vh]">
                    <ReactMarkdown>{summary}</ReactMarkdown>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={copyToClipboard}
                      className="bg-logoGreen text-white px-4 py-2 rounded-md hover:bg-logoGreen/75"
                    >
                      Copy
                    </button>
                    <button
                      onClick={closeModal}
                      className="bg-black text-white px-4 py-2 rounded-md"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            <BlogInteraction />

            {similarBlogs != null && similarBlogs.length ? (
              <>
                <h1 className="text-2xl mt-14 mb-10 font-medium">
                  Similar Blogs
                </h1>

                {similarBlogs.map((blog, i) => {
                  let {
                    author: { personal_info },
                  } = blog;

                  return (
                    <AnimationWrapper
                      key={i}
                      transition={{ duration: 1, delay: i * 0.08 }}
                    >
                      <BlogPostCard content={blog} author={personal_info} />
                    </AnimationWrapper>
                  );
                })}
              </>
            ) : (
              " "
            )}
          </div>
        </BlogContext.Provider>
      )}
    </AnimationWrapper>
  );
};

export default BlogPage;
