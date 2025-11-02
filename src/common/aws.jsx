import axios from "axios";
import { lookInSession } from "./session";

export const uploadImage = async (img) => {

    let imgUrl = null;
    let serverDomain = import.meta.env.VITE_SERVER_DOMAIN?.replace(/\/+$/, '') || '';

    try {
        // Get access token from session
        const userData = lookInSession("user");
        const access_token = userData ? JSON.parse(userData).access_token : null;

        // Get upload URL from backend
        const { data: { uploadURL } } = await axios.get(serverDomain + "/get-upload-url", {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });

        if (!uploadURL) {
            throw new Error("No upload URL received");
        }

        // Upload image to S3
        await axios({
            method: 'PUT',
            url: uploadURL,
            headers: { 'Content-Type': img.type || 'image/jpeg' },
            data: img
        });

        imgUrl = uploadURL.split("?")[0];
        
        if (!imgUrl) {
            throw new Error("Failed to get image URL");
        }
    } catch (error) {
        console.error("Upload image error:", error);
        throw error.response?.data?.error || error.message || "Image upload failed";
    }

    return imgUrl;

}