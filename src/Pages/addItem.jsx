import React, {useEffect, useState} from 'react';
import { useNavigate } from "react-router-dom";
import axios from "axios"

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
                if(res.data=="exist"){
                    alert("Item already exists")
                }
                else if(res.data=="notexist"){
                    alert("Item added successfully")
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


    return (
        <div className="d-flex justify-content-center align-items-center bg-secondary vh-100">
           
            <div className="bg-white p-3 rounded w-25">
            <h2>Add Item</h2>

            <form action="POST">
                <div className="mb-3">
                    <label htmlFor="Itemname"><strong>Item Name</strong></label>
                <input type="Itemname" autoComplete="off" onChange={(e) => { setItem_Name(e.target.value) }} placeholder="Item Name" className="form-control rounded-0" />
                </div>              
                <div className="mb-3">
                <label htmlFor="Itemgroup"><strong>Item Group</strong></label>
                <select className="form-control rounded-0" onChange={(e) => setItem_Group(e.target.value)} value={Item_group}>
                            <option value="">Select Group</option>
                           
                               { groupOptions.map((option, index) => (
                                    <option key={index} value={option}>{option}</option>
                                ))
                            }
                        </select>
                </div>
                <button type="submit" onClick={submit} className="btn btn-success w-100 rounded-0"> Submit </button>

            </form>
            </div>
        </div>
    );
}

