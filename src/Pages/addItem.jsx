import React, {useEffect, useState} from 'react';
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AddItem() {
    const navigate = useNavigate();

    const [Item_name,setItem_Name]=useState('')
    const [Item_group,setItem_Group]=useState('')
    const [groupOptions, setGroupOptions] = useState([]);

    useEffect(() => {
        axios.get("/itemgroup/GetItemgroupList")
            .then(res => {
                if (res.data.success) {
                    const options = res.data.result.map(item => item.Item_group);
                    setGroupOptions(options); 
                }
            })
            .catch(err => {
                console.error("Error fetching group options:", err);
            });
    }, []);

    async function submit(e){
        e.preventDefault();
        try{
            await axios.post("/item/addItem",{
                Item_name, Item_group
            })
            .then(res=>{
                if(res.data === "exist"){
                    alert("Item already exists")
                }
                else if(res.data === "notexist"){
                    alert("Item added successfully")
                    closeModal();
                    navigate("/home")
                }
            })
            .catch(e=>{
                alert("wrong details")
                console.log(e);
            })
        }
        catch(e){
            console.log(e);

        }
    }
    const closeModal = () => {
        navigate("/home");
     };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
            <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-6 relative">
                <button
                    onClick={closeModal}
                    className="absolute right-2 top-2 text-xl text-gray-400 hover:text-green-500"
                    type="button"
                >
                    ×
                </button>
                <h2 className="text-xl font-semibold mb-4 text-center">Add Item</h2>

                <form action="POST" className="space-y-4">
                    <div>
                        <label htmlFor="Itemname" className="block font-medium text-gray-700 mb-1">Item Name</label>
                        <input
                            type="text"
                            autoComplete="off"
                            onChange={(e) => { setItem_Name(e.target.value) }}
                            placeholder="Item Name"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
                        />
                    </div>
                    <div>
                        <label htmlFor="Itemgroup" className="block font-medium text-gray-700 mb-1">Item Group</label>
                        <select
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
                            onChange={(e) => setItem_Group(e.target.value)}
                            value={Item_group}
                        >
                            <option value="">Select Group</option>
                            {groupOptions.map((option, index) => (
                                <option key={index} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="submit"
                        onClick={submit}
                        className="w-full bg-[#25d366] hover:bg-[#128c7e] text-white font-medium py-2 rounded-lg transition"
                    >
                        Submit
                    </button>
                    <button
                        type="button"
                        className="w-full bg-gray-400 hover:bg-gray-600 text-white font-medium py-2 rounded-lg transition"
                        onClick={closeModal}
                    >
                        Close
                    </button>
                </form>
            </div>
        </div>
    );
}

