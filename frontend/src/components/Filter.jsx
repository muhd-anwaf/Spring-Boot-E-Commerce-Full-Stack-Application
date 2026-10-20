import { useEffect, useState } from "react";
import {
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SortIcon from "@mui/icons-material/Sort";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import { useSearchParams } from "react-router-dom";

const categories = [
  { categoryId: 1, categoryName: "Electronics" },
  { categoryId: 2, categoryName: "Clothing" },
  { categoryId: 3, categoryName: "Books" },
  { categoryId: 4, categoryName: "Home & Kitchen" },
  { categoryId: 5, categoryName: "Sports & Outdoors" },
];

const Filter = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [category, setCategory] = useState("all");
  const [sortOrder, setSortOrder] = useState("asc");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const currentCategory = searchParams.get("category") || "all";
    const currentSortOrder = searchParams.get("sortOrder") || "asc";
    const currentSearchTerm = searchParams.get("keyword") || "";

    setCategory(currentCategory);
    setSortOrder(currentSortOrder);
    setSearchTerm(currentSearchTerm);
  }, [searchParams]);

  const updateSearchParams = (updates) => {
    const nextParams = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value === "" || value === null || value === undefined) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, String(value));
      }
    });

    setSearchParams(nextParams);
  };

  const handleCategoryChange = (event) => {
    const selectedCategory = event.target.value;
    setCategory(selectedCategory);

    if (selectedCategory === "all") {
      updateSearchParams({ category: "" });
      return;
    }

    updateSearchParams({ category: selectedCategory });
  };

  const handleClearFilters = () => {


    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("category");
    nextParams.delete("keyword");
    nextParams.delete("sortOrder");
    setSearchParams(nextParams);
    setSearchTerm("");
    setCategory("all");
    setSortOrder("asc");
  };

  const isFiltered =
    searchTerm !== "" || category !== "all" || sortOrder !== "asc";

  const toggleSortOrder = () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newOrder);
    updateSearchParams({ sortOrder: newOrder });
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      const nextParams = new URLSearchParams(searchParams);
      const trimmedValue = searchTerm.trim();

      if (trimmedValue) {
        nextParams.set("keyword", trimmedValue);
      } else {
        nextParams.delete("keyword");
      }

      if (nextParams.toString() !== searchParams.toString()) {
        setSearchParams(nextParams);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchParams, searchTerm, setSearchParams]);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
      <TextField
        size="small"
        placeholder="Search products..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full md:max-w-sm"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      <div className="flex flex-wrap items-center gap-3 md:ml-auto">
        <FormControl size="small" className="min-w-[160px]">
          <InputLabel id="category-select-label">Category</InputLabel>
          <Select
            labelId="category-select-label"
            value={category}
            label="Category"
            onChange={handleCategoryChange}
          >
            <MenuItem value="all">All</MenuItem>
            {categories.map((item) => (
              <MenuItem key={item.categoryId} value={item.categoryName}>
                {item.categoryName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Tooltip title="Sort products">
          <Button onClick={toggleSortOrder} variant="outlined">
            Sort By
            <SortIcon className={`ml-1 ${sortOrder === "desc" ? "rotate-180" : ""}`} />
          </Button>
        </Tooltip>

        <Button
          variant="text"
          color="inherit"
          startIcon={<FilterAltOffIcon />}
          onClick={handleClearFilters}
          disabled={!isFiltered}
          className="text-gray-600"
        >
          Clear
        </Button>
      </div>
    </div>
  );
};

export default Filter;