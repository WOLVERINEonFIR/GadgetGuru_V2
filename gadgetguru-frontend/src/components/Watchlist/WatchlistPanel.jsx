import { useEffect, useMemo, useState } from "react";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Avatar,
  Badge,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { PLACEHOLDER_IMAGE, formatPrice, getGadgetId, getGadgetName } from "../GadgetCard/gadgetUtils";

const BOOKMARK_KEY = "gadget_bookmarks";

function WatchlistPanel({ gadgets = [] }) {
  const [bookmarkIds, setBookmarkIds] = useState([]);

  useEffect(() => {
    const readBookmarks = () => {
      try {
        const stored = JSON.parse(localStorage.getItem(BOOKMARK_KEY) || "[]");
        setBookmarkIds(Array.isArray(stored) ? stored.map(String) : []);
      } catch {
        setBookmarkIds([]);
      }
    };

    readBookmarks();
    window.addEventListener("gadget-bookmarks-updated", readBookmarks);
    return () => window.removeEventListener("gadget-bookmarks-updated", readBookmarks);
  }, []);

  const bookmarkedGadgets = useMemo(
    () => bookmarkIds.map((id) => gadgets.find((gadget) => getGadgetId(gadget) === id)).filter(Boolean),
    [bookmarkIds, gadgets]
  );

  const handleRemove = (id) => {
    const next = bookmarkIds.filter((item) => item !== id);
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(next));
    setBookmarkIds(next);
    window.dispatchEvent(new Event("gadget-bookmarks-updated"));
  };

  return (
    <Paper elevation={0} sx={{ bgcolor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.10)", borderRadius: 3 }}>
      {/* === WATCHLIST HEADER === */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, pt: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Watchlist
          </Typography>
          <Badge badgeContent={bookmarkIds.length} color="primary" />
        </Stack>
        <IconButton size="small" color="primary" aria-label="Open watchlist">
          <BookmarkIcon fontSize="small" />
        </IconButton>
      </Stack>

      {/* === WATCHLIST BODY === */}
      {bookmarkedGadgets.length > 0 ? (
        <>
          <List disablePadding sx={{ mt: 1 }}>
            {bookmarkedGadgets.slice(0, 5).map((gadget) => {
              const id = getGadgetId(gadget);
              const variant = gadget?.selectedVariant ?? gadget?.selected_variant ?? gadget?.variants?.[0] ?? null;
              const price = variant?.price_inr ?? gadget?.price_inr ?? gadget?.price?.sale ?? gadget?.price;
              return (
                <ListItem key={id} sx={{ pr: 6 }}>
                  <ListItemAvatar>
                    <Avatar variant="rounded" src={gadget?.image_url || gadget?.image || PLACEHOLDER_IMAGE} sx={{ width: 48, height: 48 }} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography variant="body2" noWrap>{getGadgetName(gadget)}</Typography>}
                    secondary={formatPrice(price)}
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" size="small" onClick={() => handleRemove(id)} aria-label="Remove bookmark">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
          {bookmarkedGadgets.length > 5 ? (
            <Button variant="text" size="small" fullWidth sx={{ mb: 1 }}>
              View all ({bookmarkedGadgets.length})
            </Button>
          ) : null}
        </>
      ) : (
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>
          No bookmarks yet
        </Typography>
      )}
    </Paper>
  );
}

export default WatchlistPanel;

