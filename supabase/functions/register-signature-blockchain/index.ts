import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { ethers } from "https://esm.sh/ethers@6.13.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RegisterBlockchainRequest {
  signatureId: string;
}

const CONTRACT_ABI = [
  "function registerCredit(string memory cid, string memory pdfHash) external",
  "function getCredit(uint256 id) external view returns (tuple(address borrower, string cid, string pdfHash, uint256 timestamp))",
  "function totalCredits() external view returns (uint256)",
  "event CreditRegistered(uint256 indexed id, address borrower, string cid, string pdfHash)"
];

const CONTRACT_ADDRESS = "0xc46230b7c0f61A960DaDC7c19833A442dc43320D";
const RPC_URL = "https://testnet-passet-hub-eth-rpc.polkadot.io";
const EXPLORER_URL = "https://blockscout-passet-hub.parity-testnet.parity.io";

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { signatureId }: RegisterBlockchainRequest = await req.json();

    console.log('[register-blockchain] Starting registration for signature:', signatureId);

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get signature record with contract data
    const { data: signature, error: sigError } = await supabase
      .from('contract_signatures')
      .select(`
        *,
        contracts (*)
      `)
      .eq('id', signatureId)
      .single();

    if (sigError || !signature) {
      console.error('[register-blockchain] Signature not found:', sigError);
      throw new Error('Registro de firma no encontrado');
    }

    if (signature.status !== 'otp_verified') {
      throw new Error('La firma debe estar verificada por OTP primero');
    }

    const contract = signature.contracts;
    if (!contract) {
      throw new Error('Contrato asociado no encontrado');
    }

    // Get IPFS CID from contract
    const ipfsCid = contract.ipfs_cid;
    if (!ipfsCid) {
      throw new Error('El contrato debe estar subido a IPFS primero');
    }

    // Generate PDF hash (using contract hash if available, or generating from contract data)
    let pdfHash = contract.contract_hash;
    if (!pdfHash) {
      // Generate hash from contract data
      const contractString = JSON.stringify({
        contract_id: contract.id,
        user_id: contract.user_id,
        credit_amount: contract.credit_amount,
        term_months: contract.term_months,
        interest_rate: contract.interest_rate
      });
      pdfHash = ethers.keccak256(ethers.toUtf8Bytes(contractString));
    }

    console.log('[register-blockchain] Contract CID:', ipfsCid);
    console.log('[register-blockchain] PDF Hash:', pdfHash);

    // Get corporate wallet private key
    const privateKey = Deno.env.get('CORPORATE_WALLET_PRIVATE_KEY');
    if (!privateKey) {
      throw new Error('Corporate wallet private key not configured');
    }

    // Connect to Polkadot testnet
    console.log('[register-blockchain] Connecting to blockchain...');
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log('[register-blockchain] Corporate wallet address:', wallet.address);

    // Check wallet balance
    const balance = await provider.getBalance(wallet.address);
    console.log('[register-blockchain] Wallet balance:', ethers.formatEther(balance), 'PAS');
    
    if (balance === 0n) {
      throw new Error('Corporate wallet has no funds. Please add PAS tokens to: ' + wallet.address);
    }

    // Create contract instance
    const creditRegistry = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

    // Register on blockchain
    console.log('[register-blockchain] Calling registerCredit...');
    const tx = await creditRegistry.registerCredit(ipfsCid, pdfHash);
    
    console.log('[register-blockchain] Transaction sent:', tx.hash);

    // Wait for confirmation
    console.log('[register-blockchain] Waiting for confirmation...');
    const receipt = await tx.wait();
    
    console.log('[register-blockchain] Transaction confirmed in block:', receipt.blockNumber);

    // Get the CreditRegistered event to find the credit ID
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = creditRegistry.interface.parseLog(log);
        return parsed?.name === 'CreditRegistered';
      } catch {
        return false;
      }
    });

    let creditId = null;
    if (event) {
      const parsed = creditRegistry.interface.parseLog(event);
      creditId = parsed?.args?.id?.toString();
      console.log('[register-blockchain] Credit ID:', creditId);
    }

    const explorerTxUrl = `${EXPLORER_URL}/tx/${tx.hash}`;

    // Update contract_signatures table
    const { error: updateSigError } = await supabase
      .from('contract_signatures')
      .update({
        status: 'completed',
        signed_at: new Date().toISOString(),
        blockchain_tx_hash: tx.hash,
        block_number: receipt.blockNumber,
        signature_hash: pdfHash
      })
      .eq('id', signatureId);

    if (updateSigError) {
      console.error('[register-blockchain] Error updating signature:', updateSigError);
    }

    // Update contracts table
    const { error: updateContractError } = await supabase
      .from('contracts')
      .update({
        status: 'signed',
        client_signed_at: new Date().toISOString(),
        blockchain_tx_hash: tx.hash,
        block_number: receipt.blockNumber,
        contract_hash: pdfHash
      })
      .eq('id', contract.id);

    if (updateContractError) {
      console.error('[register-blockchain] Error updating contract:', updateContractError);
    }

    console.log('[register-blockchain] Registration completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Firma registrada en blockchain exitosamente',
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        explorerUrl: explorerTxUrl,
        creditId: creditId
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[register-blockchain] Error:', error);
    
    // Even if blockchain fails, we should log it but not fail the whole process
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Error al registrar en blockchain',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
