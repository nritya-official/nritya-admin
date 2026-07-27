import React, { useState } from 'react';
import { getFTBByEmail } from '../utils/firebaseUtils';
import { Card, CardContent, Typography, TextField, Button, Select, MenuItem, Grid ,Box,  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tab, CardActionArea, Fab} from '@mui/material';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import InstaInstructors from '../Components/InstaInstructors';


function Instructors() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('email');
  const [searchResults, setSearchResults] = useState([]);
  const [value, setValue] = React.useState('1');
  const [profileMigrationData,setProfileMigrationData ] = useState('');

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleSearch = async () => {
    try {
      if (!searchQuery.trim()) return; // Do not search if query is empty or contains only whitespace

      const data = await getFTBByEmail(searchQuery.trim(), 'Instructors', selectedFilter);
      setSearchResults(data ? data : []); // If data is found, put it in an array, otherwise empty array
    } catch (error) {
      console.error('Error fetching data:', error.message);
      setSearchResults([]);
    }
  };

  const handleFilterChange = (event) => {
    setSelectedFilter(event.target.value);
  };

  return (
    <div>
      <Box sx={{ width: '100%', typography: 'body1' }}>
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={handleChange} aria-label="lab API tabs example">
            <Tab label="Search" value="1" />
            <Tab label="Instagram Instructors" value="4" />
            <Tab label="Profile Migration" value="2" />
            <Tab label="Others" value="3" />
          </TabList>
        </Box>
          <TabPanel value="1">
          <br/>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                style={{ marginRight: '8px',flex: 1  }}
              />
              <Select
                value={selectedFilter}
                onChange={handleFilterChange}
                style={{ marginRight: '8px' }}
              >
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="ownedBy">Owned By</MenuItem>
              </Select>
              <Button variant="contained" onClick={handleSearch}>Search</Button>
            </div>
            <br/>
            <div>
            {searchResults.length > 0 ? (
              <Grid container spacing={2}>
                {searchResults.map(result => (
                  <Grid item key={result.id} xs={12} sm={6} md={4} lg={3}>
                  <Card style={{ marginBottom: '16px' }}>
                    <CardContent>
                      <TableContainer>
                        <Table>
                          <TableBody>
                          {Object.entries(result)
                            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
                            .map(([key, value]) => (
                              <TableRow key={key}>
                                <TableCell component="th" scope="row">
                                  {key}
                                </TableCell>
                                <TableCell align="left">
                                  {value !== null && value !== undefined ? value.toString() : 'N/A'}
                                </TableCell>
                              </TableRow>
                            ))}

                            
                          </TableBody>
                        </Table>
                      </TableContainer>
                      <Fab variant="extended" onClick={() => {setProfileMigrationData(result); setValue('2');}}>
                        Profile Migration
                      </Fab>
                    </CardContent>
                  </Card>
                  </Grid>
                
                ))}
              </Grid>
            ) : (
              <Typography variant="body1">
                No results found.
              </Typography>
            )}
            </div>
          </TabPanel>
          <TabPanel value="2">
            <Card style={{ marginBottom: '16px',maxWidth:'30rem' }}>
                    <CardContent>
                      <TableContainer>
                        <Table>
                        {Object.entries(profileMigrationData)
                            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
                            .map(([key, value]) => (
                              <TableRow key={key}>
                                <TableCell component="th" scope="row">
                                  {key}
                                </TableCell>
                                { key==="ownedBy"?
                                <TableCell align="left">
                                  <input
                                    type="text"
                                    value={value !== null && value !== undefined ? value.toString() : ''}
                                    onChange={(e) => {
                                      setProfileMigrationData(prevData => ({
                                        ...prevData,
                                        ownedBy: e.target.value
                                      }));
                                    }}
                                  />
                                </TableCell>
                                :<>
                                <TableCell align="left">
                                  {value !== null && value !== undefined ? value.toString() : 'N/A'}
                                </TableCell>
                                </>
                                  
                                }
                            
                              </TableRow>
                            ))}
                            </Table>
                        </TableContainer>
                  </CardContent>
              </Card>
            
          </TabPanel>
          <TabPanel value="4">
            <InstaInstructors />
          </TabPanel>
        <TabPanel value="3">Others</TabPanel>
      </TabContext>
    </Box>


    </div>
  );
}

export default Instructors;
/*
Objects are not valid as a React child (found: object with keys {id, ownedBy, danceStyles, name, instagram, age, description, youtube, facebook, email, experience, createdBy, twitter}). If you meant to render a collection of children, use an array instead.
*/