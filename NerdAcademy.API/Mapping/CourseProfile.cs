using AutoMapper;
using NerdAcademy.API.DTOs;
using NerdAcademy.Data.Entities;

namespace NerdAcademy.API.Mapping
{
    public class CourseProfile : Profile
    {
        public CourseProfile()
        {
            CreateMap<CourseCreateDto, Course>()
                // convert numeric Level/Status into enum
                .ForMember(d => d.Level, opt => opt.MapFrom(s => (CourseLevel)s.Level))
                .ForMember(d => d.Status, opt => opt.MapFrom(s => (CourseStatus)s.Status))
                // ignore nav props
                .ForMember(d => d.Tags, opt => opt.Ignore())
                .ForMember(d => d.Instructor, opt => opt.Ignore())
                .ForMember(d => d.Lessons, opt => opt.Ignore())
                .ForMember(d => d.Enrollments, opt => opt.Ignore());

            CreateMap<Course, CourseReadDto>()
                .ForMember(d => d.Level, opt => opt.MapFrom(s => s.Level.ToString()))
                .ForMember(d => d.Status, opt => opt.MapFrom(s => s.Status.ToString()))
                .ForMember(d => d.TagIds, opt => opt.MapFrom(s => s.Tags.Select(t => t.Id).ToList()));
        }
    }
}
