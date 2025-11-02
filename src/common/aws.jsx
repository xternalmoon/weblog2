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
            throw new Error("No upload URL received from server");
        }

        // Check if it's a placeholder URL (means S3 not configured)
        if (uploadURL.includes('placeholder.com') || uploadURL.includes('placeholder')) {
            // For now, use a data URL as fallback until S3 is configured
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    resolve(e.target.result);
                };
                reader.onerror = () => {
                    reject(new Error("Failed to read image file"));
                };
                reader.readAsDataURL(img);
            });
        }

        // Upload image to S3
        try {
            await axios({
                method: 'PUT',
                url: uploadURL,
                headers: { 'Content-Type': img.type || 'image/jpeg' },
                data: img
            });

            imgUrl = uploadURL.split("?")[0];
            
            if (!imgUrl) {
                throw new Error("Failed to get image URL from upload");
            }
        } catch (uploadError) {
            console.error("S3 upload failed, using data URL:", uploadError);
            // Fallback to data URL if S3 upload fails
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    resolve(e.target.result);
                };
                reader.onerror = () => {
                    reject(new Error("Failed to read image file"));
                };
                reader.readAsDataURL(img);
            });
        }
    } catch (error) {
        console.error("Upload image error:", error);
        throw error.response?.data?.error || error.message || "Image upload failed";
    }

    return imgUrl;

}