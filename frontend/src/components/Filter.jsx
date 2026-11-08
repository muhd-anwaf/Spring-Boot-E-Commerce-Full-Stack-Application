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
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories } from "../store/actions";

// Search, category and price-sort controls. All state lives in the URL query string.
const Filter = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const categories = useSelector((state) => state.products.categories);

  const category = searchParams.get("category") || "all";
  const sortOrder = searchParams.get("sortOrder") === "desc" ? "desc" : "asc";
  // Only the text box needs its own state, so typing is not debounced away
  const [searchTerm, setSearchTerm] = useState(searchParams.get("keyword") || "");

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // Debounce: write the keyword to the URL half a second after typing stops
  useEffect(() => {
    const handler = setTimeout(() => {
      const nextParams = new URLSearchParams(searchParams);
      const trimmedValue = searchTerm.trim();
      const keywordChanged = (nextParams.get("keyword") ?? "") !== trimmedValue;

      if (trimmedValue) {
        nextParams.set("keyword", trimmedValue);
      } else {
        nextParams.delete("keyword");
      }
      if (keywordChanged) {
        nextParams.delete("page");
        setSearchParams(nextParams);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchParams, searchTerm, setSearchParams]);

  // Any filter change goes back to page 1
  const updateSearchParams = (updates) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("page");

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
    updateSearchParams({ category: selectedCategory === "all" ? "" : selectedCategory });
  };

  const toggleSortOrder = () => {
    updateSearchParams({ sortOrder: sortOrder === "asc" ? "desc" : "" });
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSearchParams(new URLSearchParams());
  };

  const isFiltered = searchTerm !== "" || category !== "all" || sortOrder !== "asc";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
      <TextField
        size="small"
        placeholder="Search products..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full md:max-w-sm"
        slotProps={{
          htmlInput: { "aria-label": "Search products" },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          },
        }}
      />

      <div className="flex flex-wrap items-center gap-3 md:ml-auto">
        <FormControl size="small" className="min-w-[160px]">
          <InputLabel id="category-select-label">Category</InputLabel>
          <Select
            labelId="category-select-label"
            value={categories.some((item) => item.categoryName === category) || category === "all" ? category : "all"}
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

        <Tooltip title={sortOrder === "asc" ? "Price: low to high" : "Price: high to low"}>
          <Button onClick={toggleSortOrder} variant="outlined">
            Price
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
