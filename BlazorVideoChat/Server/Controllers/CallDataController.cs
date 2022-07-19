using BlazorVideoChat.Server.Data;
using BlazorVideoChat.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace BlazorVideoChat.Server.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class CallDataController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public CallDataController(ApplicationDbContext db)
        {
            _db = db;
        }

        /**
         * Get a list of all CallData objects currently stored in the database
         * that have the passed HostId and are in progress.
         */
        [HttpGet("{HostId}")]
        public IActionResult GetHostInProgressCalls(string HostId)
        {
            var calls = _db.CallData.Where(c => c.HostId.Equals(HostId) && c.IsInProgress);

            if (calls == null)
                return NotFound($"Host with id: {HostId} does not currently have any calls in progress.");

            return Ok(calls);
        }

        /**
         * Post a new CallData object to the server. A CallData object will only
         * be posted to the server if a user exists with the HostEmail supplied.
         * UnAuthenticated users may access this endpoint (yeah I know this can be spammed
         * and abused, just my first pass of it).
         * 
         *      TODO: Find a way to not need both params in post action
         */
        [AllowAnonymous]
        [HttpPost("{HostEmail}")]
        public async Task<IActionResult> CreateNewCall(string HostEmail, [FromBody] string AttendeeToken)
        {
            // First lets get the id of the requested call host
            var host = _db.Users.FirstOrDefault(user => user.Email.Equals(HostEmail));
            if (host == null)
                return NotFound($"A host with the email {HostEmail} does not exist.");
            
            // Construct the CallData object to be stored in the db
            var call = new CallData()
            {
                Id = Guid.NewGuid(),
                HostId = host.Id,
                AttendeeToken = AttendeeToken,
            };

            // Store the new call object
            _db.Add(call);

            await _db.SaveChangesAsync();
            return Ok(call);
        }

        /**
         * Update an existing entry with the passed CallData object, or
         * create a new CallData object in the database if one with the
         * passed id does not exist.
         */
        [HttpPut]
        public async Task<IActionResult> UpdateCall([FromBody] CallData call)
        {
            var oldCall = _db.CallData.FirstOrDefault(c => c.Id.CompareTo(call.Id) == 0);

            if (oldCall == null)
            {
                _db.Add(call);
            }
            else
            {
                _db.Entry(oldCall).CurrentValues.SetValues(call);
            }

            await _db.SaveChangesAsync();
            return Ok(call);
        }
    }
}
