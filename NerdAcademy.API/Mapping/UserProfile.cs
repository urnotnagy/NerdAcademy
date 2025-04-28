
using AutoMapper;
using NerdAcademy.API.DTOs;
using NerdAcademy.Data.Entities;
using System;


namespace NerdAcademy.API.Mapping
{
    public class UserProfile : Profile
    {
        public UserProfile()
        {
            // Entity → ReadDto
            CreateMap<User, UserReadDto>()
                .ForMember(d => d.Role, opt => opt.MapFrom(src => src.Role.ToString()));

            // CreateDto → Entity
            CreateMap<UserCreateDto, User>()
                .ForMember(d => d.Role,
                           opt => opt.MapFrom(src => Enum.Parse<UserRole>(src.Role, true)))
                // we’ll hash the password in the controller/service instead of mapping it directly
                .ForMember(d => d.PasswordHash, opt => opt.Ignore())
                .ForMember(d => d.CreatedAt, opt => opt.Ignore())
                .ForMember(d => d.IsActive, opt => opt.Ignore())
                .ForMember(d => d.PasswordLastUpdated, opt => opt.Ignore());

            // UpdateDto → Entity
            CreateMap<UserUpdateDto, User>()
              // map Role specially
              .ForMember(d => d.Role,
                         opt => opt.MapFrom(src => Enum.Parse<UserRole>(src.Role, true)))
              // for _all_ other members, only map when the source value isn't null
              .ForAllMembers(opt =>
                   opt.Condition((src, dest, srcMember) => srcMember != null));

        }
    }
}
