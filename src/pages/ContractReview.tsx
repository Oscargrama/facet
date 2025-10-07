import { useState } from "react";
import Navbar from "@/components/Navbar";
import ContractList from "@/components/ContractList";
import ContractDetail from "@/pages/ContractDetail";

export default function ContractReview() {
  const [selectedContract, setSelectedContract] = useState<{
    contractId: string;
    applicationId: string;
  } | null>(null);

  const handleSelectContract = (contractId: string, applicationId: string) => {
    setSelectedContract({ contractId, applicationId });
  };

  const handleBackToList = () => {
    setSelectedContract(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container-professional py-8">
        <div className="max-w-6xl mx-auto">
          {selectedContract ? (
            <ContractDetail
              contractId={selectedContract.contractId}
              applicationId={selectedContract.applicationId}
              onBack={handleBackToList}
            />
          ) : (
            <ContractList onSelectContract={handleSelectContract} />
          )}
        </div>
      </main>
    </div>
  );
}
