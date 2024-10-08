import React, { useState } from 'react';
import { getKycListFromEmail, getKycListFromStatus,updateDocMerge, updateDocMergeKyc } from '../utils/firebaseUtils'; // Import your functions for fetching KYC data
import { Card, CardContent, CardActions, Button, Typography, TextField, MenuItem, FormControl, InputLabel, Select, TextareaAutosize, Alert } from '@mui/material';
import { SearchIcon} from '@mui/material';
import { Form } from 'react-bootstrap';


const names_map = new Map([
  ["first_name" , "First Name"],
  ["middle_last_name" , "Middle & Last Name"],
  ["phone_number" , "Phone Number"],
  ["street_address" , "Street Address"],
  ["city" , "City"],
  ["state_province" , "State"],
  ["state" , "State"],
  ["zip_pin_code" , "PIN Code/ZIP"],
  ["aadhar" , "Aadhar Number"],
  ["gstin" , "GST Number"],
  ["comments" , "Remark(s)"],
  ["UserId","UserId"],
  ['id','KYC ID']
  ])


const statusFlags = ['Submitted','Verified', 'Under Review', 'Reviewed', 'Verification Failed'];

function UserKycs() {
  const [searchMode, setSearchMode] = useState('email');
  const [searchValue, setSearchValue] = useState('');
  const [kycList, setKycList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');


  const handleSearch = async () => {
    try {
      setLoading(true);
      let kycData = [];
      
      if (searchMode === 'email') {
        kycData = await getKycListFromEmail(searchValue, 'UserKyc');
      } else if (searchMode === 'status') {
        kycData = await getKycListFromStatus(searchValue, 'UserKyc');
      } else {
        console.error('Invalid search mode.');
        return;
      }

      setKycList(kycData);
    } catch (error) {
      console.error('Error fetching KYC data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitChanges = async (kycId, statusInput, comment, userId) => {
    setStatusLoading(true);
    setErrorMsg('');  // Reset error message
  
    const timeout = setTimeout(() => {
      setStatusLoading(false);
      setErrorMsg('Network issue or server timeout. Please try again.');
    }, 60000);  // 60 seconds timeout
  
    try {
      const statusDone = await updateDocMergeKyc('UserKyc', kycId, { status: statusInput, comments: comment ? comment : "" }, userId);
      
      if (statusDone) {
        clearTimeout(timeout);
        setStatusLoading(false);
      }
    } catch (error) {
      clearTimeout(timeout);
      setStatusLoading(false);
      setErrorMsg('Error updating status: ' + error.message);
    }
  };
  

  return (
    <div>
      <br></br>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <TextField
          type="text"
          placeholder={`Enter ${searchMode}`}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          style={{ flex: 1 }}
        />
        <Button variant="contained" onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </Button>
        <FormControl fullWidth={false} style={{ marginBottom: '8px' }}>
          <InputLabel id="search-mode-label">Search Mode</InputLabel>
          <Select
            labelId="search-mode-label"
            id="search-mode"
            value={searchMode}
            onChange={(e) => setSearchMode(e.target.value)}
          >
            <MenuItem value="email">Search by Email</MenuItem>
            <MenuItem value="status">Search by Status</MenuItem>
          </Select>
        </FormControl>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '20px' }}>
        {kycList.map((kyc) => (
          <Card key={kyc.id}>
            <CardContent>
          {Object.keys(kyc).map((key) => (
            key !== 'status' && key !== 'hash' && key !== 'country' && key !== 'comments' && (
              <Typography key={key} variant="body1" component="div">
                {names_map.get(String(key))}: {kyc[key]}
              </Typography>
            )
          ))}
            </CardContent>
            <CardActions style={{ display: 'flex', justifyContent: 'space-between', flexDirection: 'column' }}>
            <Form style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Form.Select
                  value={kyc.status}
                  onChange={(e) => setKycList(prevKycList => {
                    const updatedKycList = prevKycList.map(item => {
                      if (item.id === kyc.id) {
                        return { ...item, status: e.target.value };
                      }
                      return item;
                    });
                    return updatedKycList;
                  })}
                  style={{ flex: '1 0 45%', marginRight: '10px' }}
                >
                  {statusFlags.map((flag) => (
                    <option key={flag} value={flag}>
                      {flag}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control
                  type="text"
                  placeholder="Add Comment"
                  value={kyc.comments ? kyc.comments : ''}
                  onChange={(e) => setKycList(prevKycList => {
                    const updatedKycList = prevKycList.map(item => {
                      if (item.id === kyc.id) {
                        return { ...item, comments: e.target.value };
                      }
                      return item;
                    });
                    return updatedKycList;
                  })}
                  style={{ flex: '1 0 45%' }}
                />
              </div>
              <Button variant="contained" disabled={statusLoading} onClick={() => handleSubmitChanges(kyc.id, kyc.status, kyc.comments,kyc.UserId)} style={{ marginTop: '10px' }}>
              {statusLoading ? 'Submitting...' : 'Submit Changes'}
              </Button>
            </Form>
            {statusLoading && <div>Loading...</div>}
            {errorMsg && <Alert color="error">{errorMsg}</Alert>}
          </CardActions>


          </Card>
        ))}
      </div>
    </div>
  );
}

export default UserKycs;
