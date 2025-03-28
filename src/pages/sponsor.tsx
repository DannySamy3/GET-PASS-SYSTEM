import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  useMediaQuery,
} from "@mui/material";

interface Sponsor {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
}

const SponsorPage: React.FC = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);

  useEffect(() => {
    // TODO: Fetch sponsors data from your API
    // This is just mock data for demonstration
    const mockSponsors: Sponsor[] = [
      {
        id: "1",
        name: "John Doe",
        email: "john@example.com",
        phone: "+1234567890",
        status: "Active",
        createdAt: "2024-03-20",
      },
      // Add more mock data as needed
    ];
    setSponsors(mockSponsors);
  }, []);

  return (
    <Container maxWidth='xl' sx={{ py: 4 }}>
      <Typography variant='h4' component='h1' gutterBottom>
        Sponsors
      </Typography>

      <Box
        sx={{
          width: "100%",
          overflow: "hidden",
          position: "relative",
          mt: 2,
        }}
      >
        <TableContainer
          component={Paper}
          sx={{
            maxHeight: { xs: "calc(100vh - 200px)", sm: "calc(100vh - 250px)" },
            overflow: "auto",
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-track": {
              background: "#f1f1f1",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "#888",
              borderRadius: "4px",
              "&:hover": {
                background: "#555",
              },
            },
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sponsors.map((sponsor) => (
                <TableRow key={sponsor.id}>
                  <TableCell>{sponsor.name}</TableCell>
                  <TableCell>{sponsor.email}</TableCell>
                  <TableCell>{sponsor.phone}</TableCell>
                  <TableCell>{sponsor.status}</TableCell>
                  <TableCell>{sponsor.createdAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
};

export default SponsorPage;
