// api helpers
export const apiUrl = (path) => {
	let base = import.meta.env.VITE_SERVER_DOMAIN || "";
	base = base.replace(/\/+$/, "");
	const p = path.startsWith("/") ? path : `/${path}`;
	return `${base}${p}`;
};

export const aiUrl = (path) => {
	let base = import.meta.env.VITE_AI_MODELS_URL || "";
	base = base.replace(/\/+$/, "");
	const p = path.startsWith("/") ? path : `/${path}`;
	return `${base}${p}`;
};
