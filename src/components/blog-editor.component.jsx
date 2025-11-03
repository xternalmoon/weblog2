import { useContext, useState, useEffect, useRef } from "react"; // Corrected import
import { useNavigate, useParams } from "react-router-dom"; // React Router imports
import AnimationWrapper from "../common/page-animation";
import Banner from "../imgs/blog banner light.png";
import DarkBanner from "../imgs/blog banner dark.png";
import { uploadImage } from "../common/aws";
import { Toaster, toast } from "react-hot-toast";
import { EditorContext } from "../pages/editor.pages";
import EditorJS from "@editorjs/editorjs";
import { tools } from "./tools.component";
import axios from "axios";
import { apiUrl, aiUrl } from "../common/api";
import { ThemeContext, UserContext } from "../App";

const BlogEditor = () => {
  // Extract context values with safe defaults
  const {
    blog = {}, // Default to an empty object to avoid errors
    setBlog,
    textEditor,
    setTextEditor,
    setEditorState,
  } = useContext(EditorContext);

  const {
    userAuth: { access_token } = {}, // Default to an empty object
  } = useContext(UserContext);

  const { theme } = useContext(ThemeContext);
  const { blog_id } = useParams();
  const navigate = useNavigate();

  // Destructure `blog` properties with defaults
  const {
    title = "",
    banner = "",
    content = "",
    tags = [],
    des = "",
  } = blog;

  // State for button visibility and position
  const [buttonVisible, setButtonVisible] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0 });
  
  // State for smart button visibility and position
  const [smartButtonVisible, setSmartButtonVisible] = useState(false);
  const [smartButtonPosition, setSmartButtonPosition] = useState({
    top: 0,
    left: 0,
  });

  // State for text selection and tooltip visibility
  const [selectedText, setSelectedText] = useState("");
  const [showTooltip, setShowTooltip] = useState(true);

  // Refs for managing tooltips, timeouts, and editor
  const tooltipRef = useRef(null);
  const inactivityTimeout = useRef(null);
  const editorRef = useRef(null);


  useEffect(() => {
    if (!textEditor?.isReady) {
      setTextEditor(
        new EditorJS({
          holder: "textEditor",
          data: Array.isArray(content) ? content[0] : content,
          tools: tools,
          placeholder: "Start writing your thoughts here...",
        })
      );
    }

    const handleTextSelection = () => {
      try {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        const wordCount = selectedText.split(/\s+/).length;

        if (wordCount > 0 && showTooltip) {
          setShowTooltip(false);
        }

        if (selectedText && wordCount >= 15) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          setButtonPosition({
            top: rect.top + window.scrollY - 50,
            left: rect.left + window.scrollX + rect.width / 2 - 50,
          });
          setSelectedText(selectedText);
          setButtonVisible(true);
        } else {
          setButtonVisible(false);
        }

        // Check if the user is typing in the editor (within the editorRef)
        if (
          editorRef.current &&
          editorRef.current.contains(document.activeElement)
        ) {
          // Check the total content length in the editor
          if (textEditor && textEditor.save) {
            textEditor
              .save()
              .then((outputData) => {
                let editorText = "";
                outputData.blocks.forEach((block) => {
                  if (block.type === "paragraph" && block.data.text) {
                    editorText += block.data.text.trim() + " "; // Concatenate all text
                  }
                });

                const editorWordCount = editorText
                  .split(/\s+/)
                  .filter((word) => word.length > 0).length;

                if (editorWordCount > 10) {
                  // Clear any previous timeout to reset inactivity
                  clearTimeout(inactivityTimeout.current);

                  // Set inactivity timer
                  inactivityTimeout.current = setTimeout(() => {
                    // Show the smart suggest button after 3 seconds of inactivity
                    setSmartButtonVisible(true);
                    setSmartButtonPosition({
                      top: window.scrollY + 100, // Position of the button, adjust as necessary
                      left: window.scrollX + 100, // Position of the button, adjust as necessary
                    });
                  }, 3000); // Wait for 3 seconds
                } else {
                  setSmartButtonVisible(false); // Hide the button if word count is <= 10
                }
              })
              .catch((err) => {
                console.error("Error saving content:", err);
              });
          }
        } else {
          setSmartButtonVisible(false); // Hide the button if the editor is not focused
        }
      } catch (err) {
        console.error("Error handling text selection:", err);
      }
    };

    const handleKeydown = () => {
      // Reset the inactivity timer on keydown (user activity)
      clearTimeout(inactivityTimeout.current);
      setSmartButtonVisible(false); // Hide the button on key press
    };

    document.addEventListener("selectionchange", handleTextSelection);
    document.addEventListener("keydown", handleKeydown); // Listen for keydown events to track user activity

    return () => {
      document.removeEventListener("selectionchange", handleTextSelection);
      document.removeEventListener("keydown", handleKeydown);
      clearTimeout(inactivityTimeout.current); // Clean up timeout on component unmount
    };
  }, [content, textEditor]);

  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleParaphrase = async () => {
    try {
      if (selectedText) {
        const loadingToast = toast.loading("Paraphrasing...", {
          id: "loading",
        });

        const response = await axios.post(
            aiUrl("/paraphrase"),
          { text: selectedText }
        );

        if (textEditor.isReady) {
          textEditor.save().then((data) => {
            const updatedBlocks = data.blocks.map((block) => {
              if (
                block.type === "paragraph" &&
                block.data.text.includes(selectedText)
              ) {
                const updatedText = block.data.text.replace(
                  selectedText,
                  response.data.paraphrased_text
                );
                block.data.text = updatedText;
                block.data.text = updatedText.replace(
                  response.data.paraphrased_text,
                  `<span class="highlight">${response.data.paraphrased_text}</span>`
                );

                return block;
              }
              return block;
            });

            const updatedContent = { ...data, blocks: updatedBlocks };
            textEditor.render(updatedContent); // Re-render the editor with the updated content

            setTimeout(() => {
              const highlightedText = document.querySelector(".highlight");
              if (highlightedText) {
                highlightedText.classList.remove("highlight");
              }
            }, 1500);
          });
        }

        toast.dismiss(loadingToast);
      }
    } catch (err) {
      console.error("Error handling click:", err);
      toast.dismiss("loading");

      if (err.response?.status === 429) {
        toast.error(
          "Limit reached. Try again in a minute."
        );
      } else {
        const errorMessage =
          err.response?.data?.message ||
          "Failed to generate. Please try again later.";
        toast.error(errorMessage);
      }
    }
  };

  const handlePredict = async () => {
    try {
      // Get the current content in the editor
      if (textEditor.isReady) {
        const data = await textEditor.save();
        let editorText = "";

        // Extract text from all blocks
        data.blocks.forEach((block) => {
          if (block.type === "paragraph" && block.data.text) {
            editorText += block.data.text.trim() + " "; // Concatenate all text
          }
        });

        // Get the last 10 words from the content
        const words = editorText.split(/\s+/).filter((word) => word.length > 0);
        const last10Words = words.slice(-10).join(" "); // Get last 10 words

        if (last10Words) {
          const loadingToast = toast.loading("Getting Suggestions", {
            id: "loading",
          });

          // Send the last 10 words to the /predict API
          const response = await axios.post(
            aiUrl("/predictor"),
            { text: last10Words }
          );

          // Append the response prediction to the content after the last 10 words
          if (textEditor.isReady) {
            textEditor.save().then((data) => {
              let wordCount = 0;

              // Map through the blocks and append the predicted text
              const updatedBlocks = data.blocks.map((block) => {
                if (block.type === "paragraph" && block.data.text) {
                  let blockText = block.data.text;
                  const blockWords = blockText.split(/\s+/);

                  // Count words and check where to append the prediction
                  wordCount += blockWords.length;

                  if (wordCount > words.length - 10) {
                    blockText += ` ${response.data.predicted_text}`; // Append prediction after the last 10 words
                  }

                  block.data.text = blockText;
                }
                return block;
              });

              // Update the content with the new block text
              const updatedContent = { ...data, blocks: updatedBlocks };
              textEditor.render(updatedContent); // Re-render the editor

              toast.dismiss(loadingToast);
            });
          }
        }
      }
    } catch (err) {
      console.error("Error In Predict Typing", err);
      toast.dismiss("loading");

      if (err.response?.status === 429) {
        toast.error(
          "Limit reached. Try again in a minute."
        );
      } else {
        const errorMessage =
          err.response?.data?.message ||
          "Failed to predict. Please try again later.";
        toast.error(errorMessage);
      }
    }
  };

  const handleBannerUpload = (e) => {
    let img = e.target.files[0];

    if (img) {
      let loadingToast = toast.loading("Uploading...");

      uploadImage(img)
        .then((url) => {
          if (url) {
            toast.dismiss(loadingToast);
            toast.success("Uploaded");
            setBlog({ ...blog, banner: url });
            // Reset file input to allow re-uploading same file
            e.target.value = '';
          } else {
            toast.dismiss(loadingToast);
            toast.error("Upload failed. Please try again.");
          }
        })
        .catch((err) => {
          toast.dismiss(loadingToast);
          console.error("Upload error:", err);
          toast.error(err?.message || err || "Upload failed. Please try again.");
          // Reset file input on error
          e.target.value = '';
        });
    }
  };

  const handleTitleKeyDown = (e) => {
    if (e.keyCode === 13) {
      // enter key
      e.preventDefault();
    }
  };

  const handleTitleChange = (e) => {
    let input = e.target;

    input.style.height = "auto";
    input.style.height = input.scrollHeight + "px";

    setBlog({ ...blog, title: input.value });
  };

  const handleError = (e) => {
    let img = e.target;
    img.src = theme === "light" ? Banner : DarkBanner;
  };

  const handlePublishEvent = () => {
    if (!banner.length) {
      return toast.error("Upload a blog banner to publish it");
    }

    if (textEditor.isReady) {
      textEditor
        .save()
        .then((data) => {
          if (data.blocks.length) {
            setBlog({ ...blog, content: data });
            setEditorState("publish");
          } else {
            return toast.error("Write something in your blog to publish it");
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };

  const handleSaveDraft = (e) => {
    if (e.target.className.includes("disable")) {
      return;
    }

    if (!title.length) {
      return toast.error("Write blog title before saving it as a draft");
    }

    let loadingToast = toast.loading("Saving Draft....");

    e.target.classList.add("disable");

    if (textEditor.isReady) {
      textEditor.save().then((content) => {
        let blogObj = { title, banner, des, content, tags, draft: true };

        axios
          .post(
            apiUrl("/create-blog"),
            { ...blogObj, id: blog_id },
            {
              headers: {
                Authorization: `Bearer ${access_token}`,
              },
            }
          )
          .then(() => {
            e.target.classList.remove("disable");
            toast.dismiss(loadingToast);
            toast.success("Saved");

            setTimeout(() => {
              navigate("/dashboard/blogs?tab=draft");
            }, 500);
          })
          .catch(({ response }) => {
            e.target.classList.remove("disable");
            toast.dismiss(loadingToast);
            return toast.error(response.data.error);
          });
      });
    }
  };

  return (
    <>
      <nav className="navbar">
        <p className="max-md:hidden text-black line-clamp-1 w-full">
          {title.length ? title : "New Blog"}
        </p>

        <div className="flex gap-4 ml-auto">
          <button className="btn-dark py-2" onClick={handlePublishEvent}>
            Publish
          </button>
          <button className="btn-light py-2" onClick={handleSaveDraft}>
            Save Draft
          </button>
        </div>
      </nav>
      <Toaster />
      <AnimationWrapper>
        <section>
          <div className="mx-auto max-w-[900px] w-full">
            <textarea
              defaultValue={title}
              placeholder="Blog Title"
              className="md:text-4xl text-2xl font-medium w-full h-20 outline-none resize-none mt-10 leading-tight placeholder:opacity-40 bg-white"
              onKeyDown={handleTitleKeyDown}
              onChange={handleTitleChange}
            ></textarea>

            <div className="relative aspect-video hover:opacity-80 bg-white border-4 border-grey overflow-hidden">
              <label htmlFor="uploadBanner" className="cursor-pointer block w-full h-full">
                <img 
                  src={banner || (theme === "light" ? Banner : DarkBanner)} 
                  className="w-full h-full object-cover z-20" 
                  onError={handleError}
                  alt="Blog banner"
                />
                <input
                  id="uploadBanner"
                  type="file"
                  accept=".png, .jpg, .jpeg"
                  hidden
                  onChange={handleBannerUpload}
                />
              </label>
            </div>

            <hr className="w-full opacity-10 my-5" />

            <div id="textEditor" ref={editorRef} className="font-gelasio"></div>

            {showTooltip && (
              <div
                ref={tooltipRef}
                className="fixed w-[90%] md:w-auto md:top-10 top-20 left-1/2 transform -translate-x-1/2  bg-gradient-to-br from-violet-600 to-violet-400 via-blue-500 text-fuchsia-50 px-4 py-2 rounded-lg shadow-lg"
                style={{ zIndex: 1000 }}
              >
                Select 15 or more words to paraphrase..
              </div>
            )}

            {buttonVisible && (
              <button
                className="absolute bg-gradient-to-br from-violet-600 to-violet-400 via-blue-500 text-fuchsia-50 px-4 py-2 rounded-full shadow-lg transform -translate-x-1/2 z-50"
                style={{
                  top: buttonPosition.top,
                  left: buttonPosition.left,
                }}
                title="Get better tone for cselected content"
                onClick={handleParaphrase}
              >
                Paraphrase&nbsp;
                <i className="fi fi-sr-attribution-pencil"> </i>
              </button>
            )}

            {smartButtonVisible && (
              <button
                className="absolute bg-gradient-to-br from-yellow-400 to-pink-400 via-orange-400 text-fuchsia-50 px-4 py-2 rounded-full shadow-lg transform -translate-x-1/2 z-50"
                style={{
                  top: smartButtonPosition.top,
                  left: smartButtonPosition.left,
                }}
                title="Running out of words? Get It"
                onClick={handlePredict}
              >
                Smart Suggest&nbsp;
                <i className="fi fi-rr-bolt"> </i>
              </button>
            )}
          </div>
        </section>
      </AnimationWrapper>
    </>
  );
};

export default BlogEditor;
