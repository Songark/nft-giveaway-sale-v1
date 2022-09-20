// ** MUI Imports
import * as React from 'react';
import { Alert, Grid, TextField, Card, CardContent, FormControl, InputLabel, Select, MenuItem, Button, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material'

// ** Styled Component Import
import ApexChartWrapper from 'src/@core/styles/libs/react-apexcharts'

import { useState, useEffect } from 'react'
import { getBlockchain, getTreasury } from '../../lib/ethereum.js'

// ** Hook Import
import { useSettings } from 'src/@core/hooks/useSettings'

const collectionNames = ["Minionverse", "Roosterwars"];
const typeNames_M = ["Flower", "Gargul", "Shaman", "Spider"];
const typeNames_R = ["PlayRoosters1", "PlayRoosters2", "PlayRoosters3", "PlayRoosters4"];

function collectionName(collectionId) {
  if (collectionId >= 0 && collectionId < 2) {
    return collectionNames[collectionId];
  }
  return "Invalid Collection";
}

function typeNames(collectionId) {
  if (collectionId == 0) {
    return typeNames_M;
  }
  else {
    return typeNames_R;
  }
}

function createData(id, collectionId, tokenId, address, confirmed, executed, reverted) {
  let tName = collectionName(collectionId);
  return { id, tName, tokenId, address, confirmed, executed, reverted };
}

const Dashboard = () => {
  const { settings, saveSettings } = useSettings();

  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");

  const [alertMessage, setAlertMessage] = useState({
    type: "info",
    payload: "Your action info will be alerted, here",
  });
  const [txns, setTxns] = useState([]);
  const [tier, setCollection] = useState(0);
  const [nfttype, setType] = useState(0);
  const [tokenId, setTokenId] = useState('');
  const [address, setAddress] = useState('');
  let interval;

  const handleChange = (event) => {
    const target = event.target;
    if (target.name == "tier")
      setCollection(target.value);
    else if (target.name == "nfttype")
      setType(target.value);  
    else if (target.name == "tokenId")
      setTokenId(target.value);
    else if (target.name == "address")
      setAddress(target.value);
  };

  useEffect(() => {
    const init = async () => {
      setCollection(0);
      setTokenId("");
      setAddress("");
    };

    init();
    startTxScan();
  }, []);

  const showAlert = (type /* error, success, info */, message) => {
    setAlertMessage({
      type: type,
      payload: message
    });
    setTimeout(function () {
      setAlertMessage({
        type: "",
        payload: ""
      });
    }, 15000);
  }

  const checkValidAddress = (_address) => {
    if (_address.length == 42)
      return true;
    return false;
  }

  const dropSubmit = async (e) => {
    e.preventDefault();
    if (!settings.accounts || settings.accounts.length == 0) {
      showAlert("error", "Connect to your wallet!");
      return;
    }

    const giftdrop = settings.giftdrop;
    const MinionverseContract = settings.MinionverseContract;
    const RoosterwarsContract = settings.RoosterwarsContract;
    const accounts = settings.accounts;

    try {
      if (!checkValidAddress(address)) {
        showAlert('error', `Invalid address to: ${address}`);
        return;
      }

      const start_Id = tier == 0 ? settings.minionverse.startId : settings.roosterwars.startId;
      const end_Id = tier == 0 ? settings.minionverse.endId : settings.roosterwars.endId;
      const tName = collectionName(tier);
      const realTokenId = Number(nfttype) * 50 + Number(tokenId);

      if (Number(realTokenId) < Number(start_Id) || Number(realTokenId) > Number(end_Id)) {
        showAlert('error', `${tName}: Token Id ${realTokenId} is out of range [${start_Id}, ${end_Id}]`);
        return;
      }
      
      const nftContract = tier == 0 ? MinionverseContract : RoosterwarsContract;
      const tokenOwner = (await nftContract.methods.ownerOf(realTokenId).call()).toLowerCase();
      const nftPool = await getTreasury();
      
      if(tokenOwner != nftPool) {
        showAlert('error', `${tName}: Token Id ${realTokenId} doesn't exist in the treasury.`);
        return;
      }

      const gasFee = 400000;
      const receipt = await giftdrop
        .methods
        .submitAndConfirm(
          address,
          tier,
          realTokenId,
          "0x00"
        )
        .send({ from: accounts[0], gas: gasFee });
      showAlert('success', `Submit & Confirm Success!
          -> ${tName} Token #${realTokenId}
          `
      );
      await updateTxns();
    } catch (e) {
      showAlert('error', `${e.message}`);
    }
  }

  const dropConfirm = async (e, tIndex) => {
    e.preventDefault();
    if (!settings.accounts) {
      showAlert("error", "Connect to your wallet!");
      return;
    }
    const giftdrop = settings.giftdrop;
    const accounts = settings.accounts;
    const txnIndex = tIndex;
    try {
      const gasFee = 400000;
      const receipt = await giftdrop
        .methods
        .confirmAndExecute(
          txnIndex
        )
        .send({ from: accounts[0], gas: gasFee });
      showAlert('success', `Successfully confirmed and executed!
          -> Transaction ID: ${txnIndex}
          `);
      await updateTxns();
    } catch (e) {
      showAlert('error', `${txnIndex} : ${e.message}`);
    }
  }

  const dropRevoke = async (e, tIndex) => {
    e.preventDefault();
    if (!settings.accounts) {
      showAlert("error", "Connect to your wallet!");

      return;
    }
    const giftdrop = settings.giftdrop;
    const accounts = settings.accounts;

    const txnIndex = tIndex;
    try {
      const gasFee = 100000;
      
      const receipt = await giftdrop
        .methods
        .revoke(
          txnIndex
        )
        .send({ from: accounts[0], gas: gasFee });
      showAlert('success', `Successfully revoked!
          -> Transaction ID: ${txnIndex}
          `);
      await updateTxns();
    } catch (e) {
      showAlert('error', `${txnIndex} : ${e.message}`);
    }
  }

  function startTxScan() {
    interval = setInterval(updateTxns, 1000);
  }

  async function updateTxns() {
    if (!settings.accounts) {
      return;
    }
    if(interval) { 
      clearInterval(interval);
    }
    let _txns = [];
    const giftdrop = settings.giftdrop;
    const accounts = settings.accounts;

    //******************************************************/

    const totalCount = await giftdrop.methods.getTransactionCount().call();
    for (let i = totalCount - 1; i >= 0; i--) {
      let txn = await giftdrop.methods.getTransaction(i).call();
      const _tokenId = txn.tokenId;
      const _tIndex = txn.tierIndex;
      const _confirmed = await giftdrop.methods.isConfirmed(i, accounts[0]).call();
      _txns.push(createData(i, _tIndex, _tokenId, txn.to, _confirmed, txn.executed, txn.reverted));
    }
    setTxns(_txns);
  }

  return (
    <ApexChartWrapper>
      {
        typeof alertMessage.payload !== 'undefined' && alertMessage.payload !== "" && <Alert severity={`${alertMessage.type}`}>{alertMessage.payload}</Alert>
      }
      {
        settings.minionverse != null &&
        <Alert severity={`success`}>
          {
            `Minionverses From #${settings.minionverse.startId} To #${settings.minionverse.endId},   
            Rooster Wars From #${settings.roosterwars.startId} To #${settings.roosterwars.endId}`
          }
        </Alert>
      }
      <Card sx={{ position: 'relative' }}>
        <CardContent>
          <Grid container spacing={6}>
            <Grid item sm={12} md={2} alignItems="center" justifyContent="center">
              <FormControl fullWidth>
                <InputLabel id="demo-simple-select-label">Select NFTs</InputLabel>
                <Select name="tier"
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  value={tier}
                  label="Select Type"
                  onChange={handleChange}
                >
                  <MenuItem key={0} value={0}>{collectionNames[0]}</MenuItem>
                  <MenuItem key={1} value={1}>{collectionNames[1]}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item sm={12} md={2} alignItems="center" justifyContent="center">
              <FormControl fullWidth>
                <InputLabel id="demo-simple-select-label">Select Types</InputLabel>
                <Select name="nfttype"
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  value={nfttype}
                  label="Select Type"
                  onChange={handleChange}
                >
                  {typeNames(tier).map((row, index) => (
                    <MenuItem key={index} value={index}>{row}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item sm={12} md={2} alignItems="center" justifyContent="center">
              <TextField 
                name="tokenId" 
                fullWidth label='Token Index (1~50)' 
                placeholder='Token Index' 
                value={tokenId}                 
                onChange={handleChange} />
            </Grid>
            <Grid item sm={12} md={4} alignItems="center" justifyContent="center">
              <TextField name="address" fullWidth label='Address To' placeholder='Address' value={address} onChange={handleChange} />
            </Grid>
            <Grid item sm={12} md={2} sx={{ display: 'flex' }} alignItems="center" justifyContent="center">
              <Button variant='contained' onClick={e => dropSubmit(e)}>
                Send
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell algin="left" sx={{ width: "10%" }}>#</TableCell>
              <TableCell align="left">NFT</TableCell>
              <TableCell align="left">Token Id</TableCell>
              <TableCell align="left">Address</TableCell>
              <TableCell align="left" sx={{ width: "15%" }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {txns.map((row) => (
              <TableRow
                key={row.id}
              >
                <TableCell align="left" component="th" scope="row">
                  {row.id}
                </TableCell>
                <TableCell align="left">{row.tName}</TableCell>
                <TableCell align="left">{row.tokenId}</TableCell>
                <TableCell align="left">{row.address}</TableCell>
                <TableCell align="left">
                  {
                    row.executed ?
                      (
                        <Button>{`Completed`}</Button>
                      )
                      :
                      row.reverted ?
                        (
                          <Button>{`Revoked`}</Button>
                        )
                        :
                        row.confirmed == true ?
                          (
                            <Button variant='outlined' onClick={e => dropRevoke(e, row.id)}>{`Revoke`}</Button>
                          )
                          :
                          (
                            <Button variant='outlined' onClick={e => dropConfirm(e, row.id)}>{"Confirm"}</Button>
                          )
                  }
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </ApexChartWrapper>
  )
}

export default Dashboard
