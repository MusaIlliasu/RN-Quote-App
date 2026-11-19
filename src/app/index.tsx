import useDebounced from "@/hooks/useDebounced";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  BlurEvent,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import tw from "twrnc";
import { getQuotes, Quote } from "../query/query";

export default function Index() {
  const insets = useSafeAreaInsets();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [totalQuotes, setTotalQuotes] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [error, setError] = useState<string | null>(null);

  const debouncedSearchQuery = useDebounced(searchQuery, 500);

  const loadQuotes = useCallback(
    async ({
      mode,
      page,
      limit,
    }: {
      mode: "initial" | "refresh" | "loadMore";
      page: number;
      limit: number;
    }) => {
      if (loading || refreshing) return;

      setError(null);
      if (mode === "initial") {
        setLoading(true);
      }
      if (mode === "refresh") {
        setRefreshing(true);
      }
      const result = await getQuotes({ limit, skip: (page - 1) * limit });

      setLoading(false);
      setRefreshing(false);
      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.quotes) {
        setQuotes((prevQuotes) =>
          mode === "loadMore"
            ? [...prevQuotes, ...(result?.quotes || [])]
            : result?.quotes || [],
        );
        setTotalQuotes(result?.total || 0);
      }
    },
    [],
  );

  useEffect(() => {
    loadQuotes({ mode: "initial", page: 1, limit: pageSize });
  }, [loadQuotes]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadQuotes({ mode: "refresh", page: 1, limit: pageSize }).finally(() => {
      setRefreshing(false);
    });
  }, [loadQuotes]);

  const filteredQuotes = useMemo(() => {
    if (!debouncedSearchQuery) return quotes;
    return quotes.filter(
      (quote) =>
        quote.quote
          .toLowerCase()
          .includes(debouncedSearchQuery.toLowerCase()) ||
        quote.author.toLowerCase().includes(debouncedSearchQuery.toLowerCase()),
    );
  }, [debouncedSearchQuery, quotes]);

  return (
    <View style={tw`flex-1`}>
      {/* Header Section */}
      <View
        style={[tw`bg-white p-4 shadow-md`, { paddingTop: insets.top + 20 }]}
      >
        {/* Logo */}
        <View style={tw`w-full flex-row justify-between items-center gap-1`}>
          <Image
            source={require("../../assets/icons/icon.png")}
            style={tw`w-10 h-10 rounded-full`}
          />

          <Text style={tw`text-lg font-bold`}>QUOTE APP</Text>
        </View>

        {/* Search Quote */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={tw`w-full pt-4 pb-2`}
        >
          <TextInput
            style={tw`text-gray-600 border-2 ${searchActive ? "border-green-500" : "border-gray-200"} rounded-md p-2`}
            placeholder="Search Quote..."
            placeholderTextColor="#999"
            onChangeText={(text) => setSearchQuery(text)}
            value={searchQuery}
            onFocus={() => setSearchActive(true)}
            onBlur={(e: BlurEvent) => setSearchActive(false)}
          />
        </KeyboardAvoidingView>

        <Text style={tw`text-xs text-gray-500 mt-1`}>
          {loading ? (
            "Loading quotes..."
          ) : (
            <Text style={tw`font-bold text-green-600`}>
              {`${quotes.length} of ${totalQuotes} quote${totalQuotes > 1 ? "s" : ""}`}
            </Text>
          )}
        </Text>
      </View>

      {/* Quotes List Section */}
      {loading ? (
        <View style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator size="large" color="#6b7280" />
          <Text style={tw`text-gray-500 text-sm mt-2`}>Loading quotes...</Text>
        </View>
      ) : null}

      {!loading && error ? (
        <View style={tw`flex-1 justify-center items-center`}>
          <Text style={tw`text-red-500 text-sm`}>{error}</Text>
        </View>
      ) : null}

      {!loading && !error ? (
        <View style={tw`flex-1 bg-transparent p-4`}>
          <FlatList
            data={filteredQuotes}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View
                style={tw`rounded-lg p-4 border-b border-gray-200 bg-white mb-4`}
              >
                <Text style={tw`text-sm font-sans font-semibold p-1`}>
                  <MaterialCommunityIcons name="format-quote-open" size={24} color="#6b7280" />
                  <Text style={tw``}>
                    {item.quote}
                  </Text>
                  <MaterialCommunityIcons name="format-quote-close" size={24} color="#6b7280" />
                </Text>
                <Text style={tw`text-xs text-gray-500 mt-2`}>- {item.author}</Text>
              </View>
            )}
            ListEmptyComponent={() => (
              <View style={tw`flex-1 justify-center items-center p-4`}>
                <Text style={tw`text-gray-500 text-sm`}>
                  {searchQuery
                    ? "No quotes found for your search."
                    : "No quotes available."}
                </Text>
              </View>
            )}
            refreshing={refreshing}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
            onEndReached={() => {
              if (quotes.length < totalQuotes) {
                const nextPage = page + 1;
                setPage(nextPage);
                loadQuotes({
                  mode: "loadMore",
                  page: nextPage,
                  limit: pageSize,
                });
              }
            }}
            onEndReachedThreshold={0.5}
          />
        </View>
      ) : null}
    </View>
  );
}
