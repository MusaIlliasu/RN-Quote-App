import axiosClient from "../api/axiosClient";

export type Quote = {
  id: number;
  author: string;
  quote: string;
};

export const getQuotes = async (params: { limit?: number; skip?: number }) => {
  try {
    const response = await axiosClient.get("/quotes", { params });
    if (!response.data || !response.data.quotes) {
      return { error: "No quotes found" };
    }
    return {
      quotes: response.data.quotes as Quote[],
      total: response.data.total as number,
    };
  } catch (error: any) {
    return {
      error:
        error?.response?.data?.message || error?.message || "An error occurred",
    };
  }
};
