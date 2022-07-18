using System;
using System.ComponentModel.DataAnnotations;

namespace BlazorVideoChat.Shared
{
    public class CallData
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public string HostId { get; set; }

        [Required]
        public string AttendeeToken { get; set; }

        [Required]
        public bool IsInProgress { get; set; } = true;

        [Required]
        public DateTime StartDateTime { get; set; } = DateTime.Now;
    }
}
